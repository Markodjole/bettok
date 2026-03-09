export function probabilityToDecimalOdds(probability: number): number {
  if (probability <= 0 || probability >= 1) {
    throw new Error("Probability must be between 0 and 1 exclusive");
  }
  return Math.round((1 / probability) * 100) / 100;
}

export function decimalOddsToProbability(odds: number): number {
  if (odds <= 1) {
    throw new Error("Decimal odds must be greater than 1");
  }
  return Math.round((1 / odds) * 10000) / 10000;
}

export function formatOdds(decimalOdds: number): string {
  return decimalOdds.toFixed(2);
}

export function formatProbability(probability: number): string {
  return `${Math.round(probability * 100)}%`;
}

export interface BlendedOddsInput {
  modelProbability: number;
  marketImpliedProbability: number;
  alpha?: number;
  beta?: number;
}

/**
 * Blends model probability with market-implied probability.
 * V1: alpha=1, beta=0 (model-only)
 */
export function blendProbabilities({
  modelProbability,
  marketImpliedProbability,
  alpha = 1.0,
  beta = 0.0,
}: BlendedOddsInput): number {
  const total = alpha + beta;
  return (alpha * modelProbability + beta * marketImpliedProbability) / total;
}
