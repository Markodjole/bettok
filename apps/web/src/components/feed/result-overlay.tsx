"use client";

import { formatCurrency } from "@/lib/utils";

interface UserBetRow {
  id: string;
  side_key: string;
  stake_amount: number;
  payout_amount: number | null;
  status: string;
}

interface ResultOverlayProps {
  winningOutcomeText: string;
  resolutionReasonText: string;
  userBets: UserBetRow[];
}

export function ResultOverlay({
  winningOutcomeText,
  resolutionReasonText,
  userBets,
}: ResultOverlayProps) {
  const wonBets = userBets.filter((b) => b.status === "settled_win");
  const lostBets = userBets.filter((b) => b.status === "settled_loss");
  const totalPayout = wonBets.reduce((s, b) => s + Number(b.payout_amount ?? 0), 0);
  const totalStake = userBets.reduce((s, b) => s + Number(b.stake_amount), 0);
  const net = totalPayout - totalStake;
  const hasBets = userBets.length > 0;

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-2xl bg-black/85 p-4 pb-8 backdrop-blur-sm">
      <p className="text-sm font-semibold text-white">
        Winning outcome: {winningOutcomeText}
      </p>
      <p className="mt-1 text-xs text-white/80">Why: {resolutionReasonText}</p>
      {hasBets && (
        <div className="mt-3 border-t border-white/20 pt-3">
          <p className="text-sm font-medium text-white">
            {net >= 0 ? `You won ${formatCurrency(net)}` : "You lost"}
          </p>
          {(wonBets.length > 0 || lostBets.length > 0) && (
            <div className="mt-1.5 space-y-0.5 text-xs text-white/70">
              {wonBets.map((b) => (
                <p key={b.id}>
                  Won: {b.side_key === "yes" ? "YES" : "NO"} {formatCurrency(Number(b.payout_amount ?? 0))}
                </p>
              ))}
              {lostBets.map((b) => (
                <p key={b.id}>Lost: {b.side_key === "yes" ? "YES" : "NO"}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
