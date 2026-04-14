/**
 * Frame sampler: extracts key frames from a video using ffmpeg.
 * Returns base64-encoded JPEG frames at regular intervals.
 */

import { execFile } from "child_process";
import { writeFile, readFile, readdir, unlink, mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { getFfmpegBinaryPath } from "@/lib/ffmpeg-paths";
import { ffmpegProbeMediaLog, parseDurationMsFromFfmpegLog, parseVideoMetaFromFfmpegLog } from "./ffmpeg-probe";
import type { SampledFrame } from "./types";

const MAX_FRAMES = 10;
const MIN_FRAMES = 3;
const FRAME_INTERVAL_MS = 700;
const JPEG_QUALITY = 2; // ffmpeg scale: 2 = high quality, 31 = lowest
const FRAME_WIDTH = 512;

function ffmpegExec(args: string[], timeoutMs = 30_000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(getFfmpegBinaryPath(), args, { timeout: timeoutMs }, (err, stdout, stderr) => {
      if (err) reject(new Error(`ffmpeg failed: ${err.message}\n${stderr}`));
      else resolve(stderr);
    });
  });
}

export async function getVideoDurationMs(videoPath: string): Promise<number> {
  const log = await ffmpegProbeMediaLog(videoPath);
  return parseDurationMsFromFfmpegLog(log);
}

export type ProbedVideoMeta = {
  durationMs: number;
  width: number;
  height: number;
  bitRate: number;
  codec: string;
};

/** Probe a file on disk via ffmpeg stderr (path should use a sensible extension for the container). */
export async function probeVideoFileOnDisk(videoPath: string): Promise<ProbedVideoMeta> {
  const log = await ffmpegProbeMediaLog(videoPath, 20_000);
  const durationMs = parseDurationMsFromFfmpegLog(log);
  const { width, height, bitRate, codec } = parseVideoMetaFromFfmpegLog(log);
  return { durationMs, width, height, bitRate, codec };
}

/** Write bytes to a temp file, probe, delete temp dir. */
export async function probeVideoFromBytes(videoBytes: Uint8Array, fileExt = "mp4"): Promise<ProbedVideoMeta> {
  const dir = await mkdtemp(join(tmpdir(), "probe-vid-"));
  const ext = /^[a-z0-9]+$/i.test(fileExt) ? fileExt.toLowerCase() : "mp4";
  const inPath = join(dir, `probe_input.${ext}`);
  await writeFile(inPath, videoBytes);
  try {
    return await probeVideoFileOnDisk(inPath);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

export function safeContainerExt(fileExt: string): string {
  const e = fileExt.replace(/^\./, "").toLowerCase();
  if (/^[a-z0-9]+$/.test(e) && ["mp4", "mov", "webm", "m4v", "mkv", "avi"].includes(e)) return e;
  return "mp4";
}

/**
 * Re-encode to H.264 + AAC MP4 so ffmpeg can sample frames (fixes iPhone HEVC MOV,
 * odd WebM, wrong-on-disk extensions, etc.).
 */
export async function transcodeToH264Mp4(
  videoBytes: Uint8Array,
  fileExt: string,
  timeoutMs = 120_000,
): Promise<Uint8Array> {
  const dir = await mkdtemp(join(tmpdir(), "vi-h264-"));
  const ext = safeContainerExt(fileExt);
  const inPath = join(dir, `in.${ext}`);
  const outPath = join(dir, "out.mp4");
  await writeFile(inPath, videoBytes);

  /** Downscale tall 4K phone clips so Vercel stays under memory limits (analysis only needs ~512px). */
  const analysisScale = "scale=-2:1280";

  const baseVideoArgs = [
    "-y",
    "-loglevel",
    "error",
    "-threads",
    "2",
    "-i",
    inPath,
    "-vf",
    analysisScale,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
  ];

  try {
    try {
      await ffmpegExec(
        [...baseVideoArgs, "-c:a", "aac", "-b:a", "128k", "-ar", "48000", outPath],
        timeoutMs,
      );
    } catch {
      await ffmpegExec([...baseVideoArgs, "-an", outPath], timeoutMs);
    }
    const out = await readFile(outPath);
    if (out.byteLength < 2000) {
      throw new Error("Transcoded output too small");
    }
    return new Uint8Array(out);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function sampleFrames(videoBytes: Uint8Array, fileExt = "mp4"): Promise<SampledFrame[]> {
  const dir = await mkdtemp(join(tmpdir(), "vi-frames-"));
  const ext = safeContainerExt(fileExt);
  const inPath = join(dir, `input.${ext}`);
  await writeFile(inPath, videoBytes);

  try {
    const durationMs = await getVideoDurationMs(inPath);
    const intervalSec = FRAME_INTERVAL_MS / 1000;
    const rawCount = Math.floor(durationMs / FRAME_INTERVAL_MS);
    const frameCount = Math.max(MIN_FRAMES, Math.min(MAX_FRAMES, rawCount));
    const actualInterval = frameCount <= MIN_FRAMES
      ? (durationMs / 1000) / (MIN_FRAMES + 1)
      : intervalSec;

    await ffmpegExec([
      "-y", "-i", inPath,
      "-vf", `fps=1/${actualInterval},scale=${FRAME_WIDTH}:-1`,
      "-q:v", String(JPEG_QUALITY),
      "-frames:v", String(frameCount),
      join(dir, "frame_%03d.jpg"),
    ]);

    const files = (await readdir(dir))
      .filter((f) => f.startsWith("frame_") && f.endsWith(".jpg"))
      .sort();

    const frames: SampledFrame[] = [];
    for (let i = 0; i < files.length; i++) {
      const buf = await readFile(join(dir, files[i]));
      frames.push({
        frameIndex: i,
        timestampMs: Math.round(i * actualInterval * 1000),
        base64: buf.toString("base64"),
      });
    }

    return frames;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/** Parse ISO6709-ish strings often found in QuickTime (e.g. +37.3323-122.0312/). */
function formatIso6709Location(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const m = t.match(/([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)/);
  if (!m) return t.length > 200 ? `${t.slice(0, 197)}…` : t;
  const lat = parseFloat(m[1]);
  const lon = parseFloat(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return t.length > 200 ? `${t.slice(0, 197)}…` : t;
  return `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
}

/**
 * Best-effort location hint from container metadata.
 * Without ffprobe JSON tags we only parse ffmpeg stderr / ffmetadata-style lines when present.
 */
export async function extractContainerLocationHintFromBytes(
  videoBytes: Uint8Array,
  fileExt = "mp4",
): Promise<string | null> {
  const dir = await mkdtemp(join(tmpdir(), "ffmpeg-loc-"));
  const ext = /^[a-z0-9]+$/i.test(fileExt) ? fileExt : "mp4";
  const inPath = join(dir, `in.${ext}`);
  await writeFile(inPath, videoBytes);
  try {
    let text: string;
    try {
      text = await ffmpegProbeMediaLog(inPath, 20_000);
    } catch {
      return null;
    }
    const iso6709 =
      text.match(/com\.apple\.quicktime\.location\.iso6709[=:\s]+([^\s;)]+)/i)?.[1]?.trim() ||
      text.match(/\blocation[_-]?iso6709[=:\s]+([^\s;)]+)/i)?.[1]?.trim() ||
      "";
    if (iso6709) {
      const formatted = formatIso6709Location(iso6709);
      if (formatted) return `From device metadata: ${formatted}`;
    }
    return null;
  } catch {
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
