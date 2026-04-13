/**
 * Frame sampler: extracts key frames from a video using ffmpeg.
 * Returns base64-encoded JPEG frames at regular intervals.
 */

import { execFile } from "child_process";
import { writeFile, readFile, readdir, unlink, mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import type { SampledFrame } from "./types";

const MAX_FRAMES = 10;
const MIN_FRAMES = 3;
const FRAME_INTERVAL_MS = 700;
const JPEG_QUALITY = 2; // ffmpeg scale: 2 = high quality, 31 = lowest
const FRAME_WIDTH = 512;

function ffmpegExec(args: string[], timeoutMs = 30_000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("ffmpeg", args, { timeout: timeoutMs }, (err, stdout, stderr) => {
      if (err) reject(new Error(`ffmpeg failed: ${err.message}\n${stderr}`));
      else resolve(stderr);
    });
  });
}

function ffprobeExec(args: string[], timeoutMs = 10_000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("ffprobe", args, { timeout: timeoutMs }, (err, stdout, stderr) => {
      if (err) reject(new Error(`ffprobe failed: ${err.message}\n${stderr}`));
      else resolve(stdout);
    });
  });
}

export async function getVideoDurationMs(videoPath: string): Promise<number> {
  const raw = await ffprobeExec([
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    videoPath,
  ]);
  return Math.round(parseFloat(raw.trim()) * 1000);
}

export type ProbedVideoMeta = {
  durationMs: number;
  width: number;
  height: number;
  bitRate: number;
  codec: string;
};

/** ffprobe a file on disk (path should use a sensible extension for the container). */
export async function probeVideoFileOnDisk(videoPath: string): Promise<ProbedVideoMeta> {
  const raw = await ffprobeExec(
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,codec_name,bit_rate",
      "-show_entries",
      "format=duration,bit_rate",
      "-of",
      "json",
      videoPath,
    ],
    20_000,
  );
  const o = JSON.parse(raw) as {
    streams?: Array<{ width?: number; height?: number; codec_name?: string; bit_rate?: string }>;
    format?: { duration?: string; bit_rate?: string };
  };
  const stream = o.streams?.[0];
  const format = o.format;
  const durationSec = parseFloat(format?.duration || "0");
  const br =
    Number(stream?.bit_rate) ||
    Number(format?.bit_rate) ||
    0;
  return {
    durationMs: Math.round(durationSec * 1000),
    width: Number(stream?.width) || 0,
    height: Number(stream?.height) || 0,
    bitRate: br,
    codec: String(stream?.codec_name || ""),
  };
}

/** Write bytes to a temp file, probe, delete temp dir. */
export async function probeVideoFromBytes(videoBytes: Uint8Array, fileExt = "mp4"): Promise<ProbedVideoMeta> {
  const dir = await mkdtemp(join(tmpdir(), "probe-vid-"));
  const ext = /^[a-z0-9]+$/i.test(fileExt) ? fileExt : "mp4";
  const inPath = join(dir, `probe_input.${ext}`);
  await writeFile(inPath, videoBytes);
  try {
    return await probeVideoFileOnDisk(inPath);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function sampleFrames(videoBytes: Uint8Array): Promise<SampledFrame[]> {
  const dir = await mkdtemp(join(tmpdir(), "vi-frames-"));
  const inPath = join(dir, "input.mp4");
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
 * Best-effort location hint from container metadata (GPS / QuickTime location tags).
 * Does not call the network; uses ffprobe only.
 */
export async function extractContainerLocationHintFromBytes(
  videoBytes: Uint8Array,
  fileExt = "mp4",
): Promise<string | null> {
  const dir = await mkdtemp(join(tmpdir(), "ffprobe-loc-"));
  const ext = /^[a-z0-9]+$/i.test(fileExt) ? fileExt : "mp4";
  const inPath = join(dir, `in.${ext}`);
  await writeFile(inPath, videoBytes);
  try {
    const raw = await ffprobeExec(
      ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", inPath],
      20_000,
    );
    const o = JSON.parse(raw) as {
      format?: { tags?: Record<string, string> };
      streams?: Array<{ tags?: Record<string, string> }>;
    };
    const merged: Record<string, string> = { ...(o.format?.tags || {}) };
    for (const s of o.streams || []) {
      for (const [k, v] of Object.entries(s.tags || {})) {
        if (typeof v === "string" && v.trim()) merged[k] = v.trim();
      }
    }
    const lower = new Map<string, string>();
    for (const [k, v] of Object.entries(merged)) {
      lower.set(k.toLowerCase(), v);
    }

    const iso6709 =
      lower.get("com.apple.quicktime.location.iso6709") ||
      lower.get("location-iso6709") ||
      lower.get("location_iso6709");
    if (iso6709) {
      const formatted = formatIso6709Location(iso6709);
      if (formatted) return `From device metadata: ${formatted}`;
    }

    const loc =
      lower.get("location") ||
      lower.get("location-eng") ||
      lower.get("location_eng") ||
      lower.get("com.apple.quicktime.location.name");
    if (loc && loc.length > 2) {
      return loc.length > 200 ? `From file: ${loc.slice(0, 197)}…` : `From file: ${loc}`;
    }

    const lat = lower.get("gps_latitude") || lower.get("latitude");
    const lon = lower.get("gps_longitude") || lower.get("longitude");
    if (lat && lon) {
      return `From file: ${lat}, ${lon}`.slice(0, 240);
    }

    return null;
  } catch {
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
