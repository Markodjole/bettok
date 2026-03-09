import { z } from "zod";

export const settlementScoreSchema = z.object({
  market_key: z.string(),
  yes_correctness: z.number().min(0).max(1),
  no_correctness: z.number().min(0).max(1),
  explanation_short: z.string(),
  explanation_long: z.string().nullable(),
  evidence_bullets: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export type SettlementScore = z.infer<typeof settlementScoreSchema>;

/**
 * Mock settlement scoring.
 */
export function mockScoreSettlement(
  marketKey: string,
  _continuationSummary: string
): SettlementScore {
  const yesScore = Math.round((0.3 + Math.random() * 0.4) * 100) / 100;

  return {
    market_key: marketKey,
    yes_correctness: yesScore,
    no_correctness: Math.round((1 - yesScore) * 100) / 100,
    explanation_short: `The prediction "${marketKey}" was ${yesScore > 0.5 ? "largely" : "not sufficiently"} reflected in the continuation.`,
    explanation_long: null,
    evidence_bullets: [
      "Analyzed continuation scene against prediction",
      `Score: ${Math.round(yesScore * 100)}% match`,
    ],
    confidence: 0.8,
  };
}

export const SETTLEMENT_SYSTEM_PROMPT = `You are a fair and precise story-outcome judge. Given the original paused clip context, a canonical prediction market, and the actual continuation that occurred, determine how correct the YES side of the prediction was.

Score yes_correctness from 0.0 to 1.0:
- 1.0 = the predicted event fully and clearly occurred
- 0.5 = ambiguous, unclear, or insufficient evidence either way
- 0.0 = the predicted event clearly did not occur

no_correctness = 1 - yes_correctness

Provide clear reasoning and evidence bullets.

Return JSON:
{
  market_key: string,
  yes_correctness: number (0-1),
  no_correctness: number (0-1),
  explanation_short: string,
  explanation_long: string | null,
  evidence_bullets: string[],
  confidence: number (0-1)
}`;
