import { z } from "zod";

export const oddsOutputSchema = z.object({
  market_key: z.string(),
  side_yes_probability: z.number().min(0.01).max(0.99),
  side_no_probability: z.number().min(0.01).max(0.99),
  reasoning_short: z.string(),
  reasoning_detailed: z.string().nullable(),
  rejected_for_story_break: z.boolean(),
  plausibility_score: z.number().min(0).max(1),
  cinematic_score: z.number().min(0).max(1),
  surprise_score: z.number().min(0).max(1),
  retention_score: z.number().min(0).max(1),
});

export type OddsOutput = z.infer<typeof oddsOutputSchema>;

/**
 * Mock odds generation with sensible defaults.
 */
export function mockGenerateOdds(marketKey: string): OddsOutput {
  const base = 0.3 + Math.random() * 0.4;

  return {
    market_key: marketKey,
    side_yes_probability: Math.round(base * 100) / 100,
    side_no_probability: Math.round((1 - base) * 100) / 100,
    reasoning_short: `Based on scene analysis, ${marketKey} has moderate plausibility`,
    reasoning_detailed: null,
    rejected_for_story_break: false,
    plausibility_score: 0.5 + Math.random() * 0.3,
    cinematic_score: 0.5 + Math.random() * 0.3,
    surprise_score: 0.2 + Math.random() * 0.5,
    retention_score: 0.5 + Math.random() * 0.3,
  };
}

export const ODDS_SYSTEM_PROMPT = `You are an elite film story analyst and commercial short-video director. Given the current scene and candidate next-event predictions, estimate how plausible each prediction is if the next continuation should remain coherent, engaging, and watchable. Avoid random nonsense. Reward logical escalation, character consistency, genre consistency, and strong viewer retention.

Return a JSON array of objects, one per prediction, with this schema:
{
  market_key: string,
  side_yes_probability: number (0.01-0.99),
  side_no_probability: number (0.01-0.99),
  reasoning_short: string,
  reasoning_detailed: string | null,
  rejected_for_story_break: boolean,
  plausibility_score: number (0-1),
  cinematic_score: number (0-1),
  surprise_score: number (0-1),
  retention_score: number (0-1)
}`;
