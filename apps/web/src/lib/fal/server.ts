import { fal } from "@fal-ai/client";

let configured = false;

/**
 * Fal queue: time allowed before the job *starts* (queue wait + routing). If too low,
 * the API returns 408 "Request Timeout" while still queued — common under load.
 * Value is in seconds (header `x-fal-request-timeout`).
 */
export const FAL_QUEUE_START_TIMEOUT_SECONDS = 30 * 60;

/**
 * Client-side max wait for `fal.subscribe` polling/stream (milliseconds).
 */
export const FAL_SUBSCRIBE_TIMEOUT_MS = 45 * 60 * 1000;

/** Pass into every `fal.subscribe` / queue run so long Kling jobs don't fail at ~5s. */
export const falLongJobOptions = {
  startTimeout: FAL_QUEUE_START_TIMEOUT_SECONDS,
  timeout: FAL_SUBSCRIBE_TIMEOUT_MS,
} as const;

export function getFalClient() {
  if (!configured) {
    const rawKey =
      process.env.FAL_KEY ||
      process.env.FAL_API_KEY ||
      process.env.FAL_CLIENT_KEY ||
      "";
    const key = rawKey.replace(/^Bearer\s+/i, "").trim();
    if (!key) {
      throw new Error("Missing FAL_KEY env var");
    }
    fal.config({ credentials: key });
    configured = true;
  }
  return fal;
}

