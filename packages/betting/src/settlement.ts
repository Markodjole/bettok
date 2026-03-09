import type { MarketSideKey } from "@bettok/types";

export interface SettlementInput {
  yesPool: number;
  noPool: number;
  yesCorrectness: number;
}

export interface SettlementOutput {
  winnerSide: MarketSideKey | null;
  strength: number;
  transferAmount: number;
  yesFinalPool: number;
  noFinalPool: number;
}

/**
 * Core settlement calculation.
 * - s > 0.5 => YES wins, s < 0.5 => NO wins, s = 0.5 => draw/refund
 * - strength = 2 * |s - 0.5|
 * - transfer = losingPool * strength
 */
export function calculateSettlement(input: SettlementInput): SettlementOutput {
  const { yesPool, noPool, yesCorrectness } = input;
  const s = yesCorrectness;

  if (Math.abs(s - 0.5) < 0.001) {
    return {
      winnerSide: null,
      strength: 0,
      transferAmount: 0,
      yesFinalPool: yesPool,
      noFinalPool: noPool,
    };
  }

  const winnerSide: MarketSideKey = s > 0.5 ? "yes" : "no";
  const strength = 2 * Math.abs(s - 0.5);

  const losingPool = winnerSide === "yes" ? noPool : yesPool;
  const winningPool = winnerSide === "yes" ? yesPool : noPool;
  const transferAmount = Math.round(losingPool * strength * 100) / 100;

  const winFinal = winningPool + transferAmount;
  const loseFinal = losingPool - transferAmount;

  return {
    winnerSide,
    strength: Math.round(strength * 10000) / 10000,
    transferAmount,
    yesFinalPool: winnerSide === "yes" ? winFinal : loseFinal,
    noFinalPool: winnerSide === "no" ? winFinal : loseFinal,
  };
}

export interface BettorPayoutInput {
  userStake: number;
  sidePool: number;
  sideFinalPool: number;
}

/**
 * Proportional payout for a bettor on the settled side.
 */
export function calculateBettorPayout(input: BettorPayoutInput): number {
  const { userStake, sidePool, sideFinalPool } = input;
  if (sidePool <= 0) return userStake;
  const share = userStake / sidePool;
  return Math.round(share * sideFinalPool * 100) / 100;
}

export function calculatePnL(payout: number, stake: number): number {
  return Math.round((payout - stake) * 100) / 100;
}
