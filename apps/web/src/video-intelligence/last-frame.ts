/**
 * Extract the last frame of a video as a JPEG buffer.
 * Used to seed the next clip's start_image_url for visual continuity.
 */

import { execFile } from "child_process";
import { writeFile, readFile, mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

function ffmpegExec(args: string[], timeoutMs = 30_000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("ffmpeg", args, { timeout: timeoutMs }, (err, _stdout, stderr) => {
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

/**
 * Extract the last frame of a video as a JPEG buffer.
 * Strategy: get duration via ffprobe, seek to (duration - 0.1s), grab 1 frame.
 */
export async function extractLastFrame(videoBytes: Uint8Array): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "lastframe-"));
  const inPath = join(dir, "input.mp4");
  const outPath = join(dir, "last.jpg");
  await writeFile(inPath, videoBytes);

  try {
    const durationRaw = await ffprobeExec([
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      inPath,
    ]);
    const durationSec = parseFloat(durationRaw.trim());
    const seekTo = Math.max(0, durationSec - 0.1);

    await ffmpegExec([
      "-y",
      "-ss", String(seekTo),
      "-i", inPath,
      "-frames:v", "1",
      "-q:v", "2",
      outPath,
    ]);

    return await readFile(outPath);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
