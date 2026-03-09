import { z } from "zod";

export const normalizationOutputSchema = z.object({
  market_key: z.string(),
  canonical_text: z.string(),
  side_key: z.enum(["yes", "no"]),
  confidence: z.number().min(0).max(1),
  explanation: z.string(),
  merged_with_existing: z.string().nullable(),
});

export type NormalizationOutput = z.infer<typeof normalizationOutputSchema>;

/**
 * Mock normalization: simple key derivation from raw text.
 * Real implementation will use LLM with clip context.
 */
export function mockNormalize(rawText: string): NormalizationOutput {
  const cleaned = rawText
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_");

  return {
    market_key: cleaned.slice(0, 60),
    canonical_text: rawText.trim(),
    side_key: "yes",
    confidence: 0.85,
    explanation: `Normalized from raw input: "${rawText}"`,
    merged_with_existing: null,
  };
}

export function buildNormalizationPrompt(
  clipContext: string,
  rawText: string,
  existingMarkets: { market_key: string; canonical_text: string }[]
): string {
  const existingList = existingMarkets
    .map((m) => `- [${m.market_key}] "${m.canonical_text}"`)
    .join("\n");

  return `Given the current scene context and an existing list of prediction markets, normalize the following user prediction into a canonical market.

## Scene Context
${clipContext}

## Existing Markets
${existingList || "(none yet)"}

## User Prediction
"${rawText}"

## Instructions
- If this prediction matches an existing market, return that market's key in merged_with_existing.
- If it's a new concept, create a new market_key (snake_case, descriptive, max 60 chars).
- The canonical_text should be a clear, neutral phrasing.
- side_key should be "yes" — the raw prediction always maps to the YES side.
- confidence: how confident you are in the normalization (0-1).

Return JSON matching this schema:
{ market_key, canonical_text, side_key, confidence, explanation, merged_with_existing }`;
}
