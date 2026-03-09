"use client";

import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, MinusCircle, AlertCircle } from "lucide-react";

interface ResultCardProps {
  market: {
    id: string;
    canonical_text: string;
    market_key: string;
    status: string;
    market_sides: Array<{
      id: string;
      side_key: "yes" | "no";
      pool_amount: number;
    }>;
  };
  userBets: Record<string, unknown>[];
  settlementResult?: {
    yes_correctness: number;
    winner_side: "yes" | "no" | null;
    strength: number;
    explanation_short: string;
  } | null;
}

export function ResultCard({
  market,
  userBets,
  settlementResult,
}: ResultCardProps) {
  const yesCorrectness = settlementResult?.yes_correctness ?? 0.5;
  const winnerSide = settlementResult?.winner_side ?? null;
  const explanation =
    settlementResult?.explanation_short ??
    "Settlement pending...";

  const userBet = userBets[0] as Record<string, unknown> | undefined;
  const userSide = userBet?.side_key as "yes" | "no" | undefined;
  const userStake = Number(userBet?.stake_amount || 0);
  const userPayout = Number(userBet?.payout_amount || 0);
  const userWon = userSide === winnerSide;
  const pnl = userPayout - userStake;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <p className="text-sm font-medium">{market.canonical_text}</p>
          {winnerSide && (
            <Badge
              variant={winnerSide === "yes" ? "success" : "destructive"}
              className="shrink-0 text-[10px]"
            >
              {winnerSide.toUpperCase()} wins
            </Badge>
          )}
        </div>

        {/* Correctness bar */}
        <div className="mb-2">
          <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="bg-success transition-all"
              style={{ width: `${yesCorrectness * 100}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{Math.round(yesCorrectness * 100)}% correct</span>
            <span>Strength: {((settlementResult?.strength ?? 0) * 100).toFixed(0)}%</span>
          </div>
        </div>

        <p className="mb-3 text-xs text-muted-foreground">{explanation}</p>

        {/* User's bet result */}
        {userBet && (
          <div
            className={cn(
              "flex items-center justify-between rounded-lg border p-3",
              userWon
                ? "border-success/30 bg-success/5"
                : "border-destructive/30 bg-destructive/5"
            )}
          >
            <div className="flex items-center gap-2">
              {userWon ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <div>
                <p className="text-xs font-medium">
                  Your bet: {(userSide || "").toUpperCase()} —{" "}
                  {formatCurrency(userStake)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {userWon ? "You won!" : "Better luck next time"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={cn(
                  "text-sm font-bold",
                  pnl >= 0 ? "text-success" : "text-destructive"
                )}
              >
                {pnl >= 0 ? "+" : ""}
                {formatCurrency(pnl)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Payout: {formatCurrency(userPayout)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
