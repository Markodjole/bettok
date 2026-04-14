/**
 * Container / stream metadata via ffmpeg stderr (avoids ffprobe-static, which ships ~335MB
 * of multi-platform binaries and blows past Vercel’s 250MB per-function limit).
 */

import { execFile } from "child_process";
import { getFfmpegBinaryPath } from "@/lib/ffmpeg-paths";

/** ffmpeg exits non-zero after showing input info; we still parse stderr if it contains Duration. */
export function ffmpegProbeMediaLog(videoPath: string, timeoutMs = 25_000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      getFfmpegBinaryPath(),
      [
        "-hide_banner",
        "-nostdin",
        "-loglevel",
        "info",
        "-i",
        videoPath,
        "-map",
        "0:v:0",
        "-frames:v",
        "0",
        "-f",
        "null",
        "-",
      ],
      { timeout: timeoutMs, maxBuffer: 25 * 1024 * 1024 },
      (err, stdout, stderr) => {
        const msg = `${stderr || ""}${stdout || ""}`;
        if (/Duration:\s*\d{2}:/.test(msg)) {
          resolve(msg);
          return;
        }
        if (err) {
          reject(new Error(`ffmpeg probe failed: ${err.message}\n${msg.slice(0, 1200)}`));
          return;
        }
        reject(new Error(`ffmpeg probe: no duration in output\n${msg.slice(0, 1200)}`));
      },
    );
  });
}

export function parseDurationMsFromFfmpegLog(log: string): number {
  const m = log.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}\.\d+)/);
  if (!m) return 0;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const sec = parseFloat(m[3]);
  return Math.round((h * 3600 + min * 60 + sec) * 1000);
}

export function parseVideoMetaFromFfmpegLog(log: string): {
  width: number;
  height: number;
  bitRate: number;
  codec: string;
} {
  const vi = log.search(/Stream\s+#\d+:\d+.*Video:/i);
  const win = vi >= 0 ? log.slice(vi, vi + 520) : log;
  const codecM = win.match(/Video:\s*(\w+)/i);
  const codec = codecM ? codecM[1] : "";
  const dim = win.match(/\b(\d{3,5})\s*x\s*(\d{3,5})\b/);
  const width = dim ? parseInt(dim[1], 10) : 0;
  const height = dim ? parseInt(dim[2], 10) : 0;

  let bitRate = 0;
  const kb = log.match(/bitrate:\s*(\d+)\s*kb\/s/i);
  if (kb) bitRate = parseInt(kb[1], 10) * 1000;
  else {
    const bps = log.match(/bitrate:\s*(\d+)\s*bps/i);
    if (bps) bitRate = parseInt(bps[1], 10);
  }

  return { width, height, bitRate, codec };
}
