import { chmodSync, existsSync } from "fs";
import ffmpegBinary from "ffmpeg-static";

/**
 * Bundled ffmpeg (linux x64 on Vercel). Static import + `outputFileTracingIncludes`
 * ensure Vercel copies the binary into the serverless bundle (dynamic `require` is not traced).
 *
 * Override (optional): `FFMPEG_BIN` — full path to ffmpeg.
 *
 * The binary may lose the executable bit in the deploy archive; we chmod once before first exec.
 */

const chmodOnce = new Set<string>();

function ensureExecutable(binPath: string) {
  if (binPath === "ffmpeg") return;
  if (chmodOnce.has(binPath)) return;
  chmodOnce.add(binPath);
  try {
    chmodSync(binPath, 0o755);
  } catch {
    /* ignore */
  }
}

function bundledFfmpegPath(): string | null {
  const env = process.env.FFMPEG_BIN?.trim();
  if (env && existsSync(env)) {
    ensureExecutable(env);
    return env;
  }
  if (typeof ffmpegBinary === "string" && ffmpegBinary.length > 0 && existsSync(ffmpegBinary)) {
    ensureExecutable(ffmpegBinary);
    return ffmpegBinary;
  }
  return null;
}

let ffmpegResolved: string | undefined;

export function getFfmpegBinaryPath(): string {
  if (ffmpegResolved) return ffmpegResolved;
  ffmpegResolved = bundledFfmpegPath() || "ffmpeg";
  return ffmpegResolved;
}
