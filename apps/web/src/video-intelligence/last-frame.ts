/**
 * Extract the last frame of a video as a JPEG buffer.
 * Used to seed the next clip's start_image_url for visual continuity.
 */

import { execFile } from "child_process";
import { writeFile, readFile, mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { getFfmpegBinaryPath } from "@/lib/ffmpeg-paths";
import { getVideoDurationMs } from "./frame-sampler";

function ffmpegExec(args: string[], timeoutMs = 30_000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(getFfmpegBinaryPath(), args, { timeout: timeoutMs }, (err, _stdout, stderr) => {
      if (err) reject(new Error(`ffmpeg failed: ${err.message}\n${stderr}`));
      else resolve(stderr);
    });
  });
}

/**
 * Extract the last frame of a video as a JPEG buffer.
 * Strategy: get duration via ffmpeg stderr probe, seek to (duration - 0.1s), grab 1 frame.
 */
export async function extractLastFrame(videoBytes: Uint8Array): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "lastframe-"));
  const inPath = join(dir, "input.mp4");
  const outPath = join(dir, "last.jpg");
  await writeFile(inPath, videoBytes);

  try {
    const durationMs = await getVideoDurationMs(inPath);
    const durationSec = durationMs / 1000;
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
