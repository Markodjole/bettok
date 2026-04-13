import { existsSync } from "fs";

/**
 * Bundled ffmpeg/ffprobe (linux x64 on Vercel). Falls back to PATH for local dev
 * when static binaries are missing.
 */

function tryFfmpegStatic(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const p = require("ffmpeg-static") as string | null | undefined;
    if (typeof p === "string" && p.length > 0 && existsSync(p)) return p;
  } catch {
    /* optional */
  }
  return null;
}

function tryFfprobeStatic(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("ffprobe-static") as { path?: string } | undefined;
    const p = mod?.path;
    if (typeof p === "string" && p.length > 0 && existsSync(p)) return p;
  } catch {
    /* optional */
  }
  return null;
}

let ffmpegResolved: string | undefined;
let ffprobeResolved: string | undefined;

export function getFfmpegBinaryPath(): string {
  if (ffmpegResolved) return ffmpegResolved;
  ffmpegResolved = tryFfmpegStatic() || "ffmpeg";
  return ffmpegResolved;
}

export function getFfprobeBinaryPath(): string {
  if (ffprobeResolved) return ffprobeResolved;
  ffprobeResolved = tryFfprobeStatic() || "ffprobe";
  return ffprobeResolved;
}
