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
