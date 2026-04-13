import { chmodSync, existsSync } from "fs";

/**
 * Bundled ffmpeg/ffprobe (linux x64 on Vercel). Falls back to PATH for local dev
 * when static binaries are missing.
 *
 * Overrides (optional):
 * - FFMPEG_BIN — full path to ffmpeg (also respected by `ffmpeg-static` at install time)
 * - FFPROBE_BIN — full path to ffprobe
 *
 * Vercel/serverless: bundled binaries may lose the executable bit in the archive;
 * we chmod once before first exec.
 */

const chmodOnce = new Set<string>();

function ensureExecutable(binPath: string) {
  if (binPath === "ffmpeg" || binPath === "ffprobe") return;
  if (chmodOnce.has(binPath)) return;
  chmodOnce.add(binPath);
  try {
    chmodSync(binPath, 0o755);
  } catch {
    /* ignore */
  }
}

function tryFfmpegStatic(): string | null {
  const env = process.env.FFMPEG_BIN?.trim();
  if (env && existsSync(env)) {
    ensureExecutable(env);
    return env;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const p = require("ffmpeg-static") as string | null | undefined;
    if (typeof p === "string" && p.length > 0 && existsSync(p)) {
      ensureExecutable(p);
      return p;
    }
  } catch {
    /* optional */
  }
  return null;
}

function tryFfprobeStatic(): string | null {
  const env = process.env.FFPROBE_BIN?.trim() || process.env.FFPROBE_PATH?.trim();
  if (env && existsSync(env)) {
    ensureExecutable(env);
    return env;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("ffprobe-static") as { path?: string } | undefined;
    const p = mod?.path;
    if (typeof p === "string" && p.length > 0 && existsSync(p)) {
      ensureExecutable(p);
      return p;
    }
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
