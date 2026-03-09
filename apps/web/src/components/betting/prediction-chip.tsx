"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PredictionChipProps {
  canonicalText: string;
  yesProbability: number;
  noProbability: number;
  yesOdds: number;
  noOdds: number;
  yesPool: number;
  noPool: number;
  activeSide?: "yes" | "no" | null;
  onSelectSide: (side: "yes" | "no") => void;
  className?: string;
}

export function PredictionChip({
  canonicalText,
  yesProbability,
  yesOdds,
  noOdds,
  yesPool,
  noPool,
  activeSide,
  onSelectSide,
  className,
}: PredictionChipProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-3", className)}>
      <p className="mb-2 text-sm font-medium text-foreground">{canonicalText}</p>

      <div className="flex gap-2">
        <button
          onClick={() => onSelectSide("yes")}
          className={cn(
            "flex flex-1 flex-col items-center rounded-lg border p-2 transition-all",
            activeSide === "yes"
              ? "border-success bg-success/10 text-success"
              : "border-border hover:border-success/50"
          )}
        >
          <span className="text-xs font-semibold uppercase">Yes</span>
          <span className="text-lg font-bold">{yesOdds.toFixed(2)}x</span>
          <span className="text-[10px] text-muted-foreground">
            ${yesPool.toFixed(0)} pool
          </span>
        </button>

        <button
          onClick={() => onSelectSide("no")}
          className={cn(
            "flex flex-1 flex-col items-center rounded-lg border p-2 transition-all",
            activeSide === "no"
              ? "border-destructive bg-destructive/10 text-destructive"
              : "border-border hover:border-destructive/50"
          )}
        >
          <span className="text-xs font-semibold uppercase">No</span>
          <span className="text-lg font-bold">{noOdds.toFixed(2)}x</span>
          <span className="text-[10px] text-muted-foreground">
            ${noPool.toFixed(0)} pool
          </span>
        </button>
      </div>

      {/* Probability bar */}
      <div className="mt-2 flex h-1.5 overflow-hidden rounded-full">
        <div
          className="bg-success transition-all"
          style={{ width: `${yesProbability * 100}%` }}
        />
        <div
          className="bg-destructive transition-all"
          style={{ width: `${(1 - yesProbability) * 100}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{Math.round(yesProbability * 100)}% Yes</span>
        <span>{Math.round((1 - yesProbability) * 100)}% No</span>
      </div>
    </div>
  );
}
