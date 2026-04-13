/**
 * Extract mono 16kHz WAV from video bytes and transcribe with OpenAI Whisper.
 * Used for prediction/continuation context (speech affects options and story).
 */

import { execFile } from "child_process";
import { createReadStream } from "fs";
import { writeFile, readFile, mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { getFfmpegBinaryPath } from "@/lib/ffmpeg-paths";
import { log } from "./utils";

const MAX_AUDIO_SEC = 120;

function ffmpegAudio(args: string[], timeoutMs = 90_000): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(getFfmpegBinaryPath(), args, { timeout: timeoutMs }, (err, _stdout, stderr) => {
      if (err) reject(new Error(`${err.message}\n${stderr}`));
      else resolve();
    });
  });
}

export type ClipAudioTranscription = {
  transcript: string | null;
  language: string | null;
};

/**
 * Returns null transcript when there is no usable audio track, ffmpeg fails, or API is unavailable.
 */
export async function transcribeClipAudioFromVideoBytes(
  videoBytes: Uint8Array,
): Promise<ClipAudioTranscription> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey || process.env.LLM_PROVIDER !== "openai") {
    log("audio-transcribe", "skip", { reason: "no_openai" });
    return { transcript: null, language: null };
  }

  const dir = await mkdtemp(join(tmpdir(), "vi-audio-"));
  const videoPath = join(dir, "input.mp4");
  const wavPath = join(dir, "speech.wav");

  try {
    await writeFile(videoPath, videoBytes);
    try {
      await ffmpegAudio(
        [
          "-y",
          "-i",
          videoPath,
          "-vn",
          "-ac",
          "1",
          "-ar",
          "16000",
          "-c:a",
          "pcm_s16le",
          "-t",
          String(MAX_AUDIO_SEC),
          wavPath,
        ],
        90_000,
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      log("audio-transcribe", "ffmpeg_skip", { message: msg.slice(0, 200) });
      return { transcript: null, language: null };
    }

    const wavBuf = await readFile(wavPath).catch(() => null);
    if (!wavBuf || wavBuf.length < 800) {
      log("audio-transcribe", "skip", { reason: "wav_too_small" });
      return { transcript: null, language: null };
    }

    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });
    const model = process.env.LLM_MODEL_WHISPER || "whisper-1";

    const res = await client.audio.transcriptions.create({
      file: createReadStream(wavPath),
      model,
      response_format: "verbose_json",
    });

    const text = typeof (res as { text?: string }).text === "string" ? (res as { text: string }).text.trim() : "";
    const language =
      typeof (res as { language?: string }).language === "string"
        ? (res as { language: string }).language.trim()
        : null;

    if (!text) {
      log("audio-transcribe", "empty", { model });
      return { transcript: null, language };
    }

    log("audio-transcribe", "ok", {
      model,
      language,
      chars: text.length,
    });

    return { transcript: text.slice(0, 4000), language };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    log("audio-transcribe", "error", { message: message.slice(0, 240) });
    return { transcript: null, language: null };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
