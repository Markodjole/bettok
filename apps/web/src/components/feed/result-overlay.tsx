"use client";

import { useState, useEffect, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { describeUserBet, marketResolvedPhrase } from "@/lib/bet-display";
import type {
  ClipSettlementMarketRow,
  UserCharacterBettingSummary,
} from "@/actions/bets";

interface PredictionMarketEmbed {
  canonical_text?: string | null;
  raw_creator_input?: string | null;
}

interface UserBetRow {
  id: string;
  side_key: string;
  stake_amount: number;
  payout_amount: number | null;
  status: string;
  prediction_markets?: PredictionMarketEmbed | PredictionMarketEmbed[] | null;
}

function marketCanonical(b: UserBetRow): string {
  const m = b.prediction_markets;
  const row = Array.isArray(m) ? m[0] : m;
  const raw = row?.canonical_text || row?.raw_creator_input || "this clip";
  return raw.replace(/\s+/g, " ").trim();
}

function shortNarrative(text: string, max = 200): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "";
  const cut = t.split(/(?<=[.!?])\s+/)[0];
  if (cut && cut.length <= max + 40) return cut;
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

interface ResultOverlayProps {
  winningOutcomeText: string;
  resolutionReasonText: string;
  userBets: UserBetRow[];
  settlementMarkets: ClipSettlementMarketRow[];
  characterName?: string | null;
  characterStats?: UserCharacterBettingSummary | null;
}

export function ResultOverlay({
  winningOutcomeText,
  resolutionReasonText,
  userBets,
  settlementMarkets,
  characterName,
  characterStats,
}: ResultOverlayProps) {
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [showPayout, setShowPayout] = useState(false);

  const wonBets = userBets.filter((b) => b.status === "settled_win");
  const totalPayout = wonBets.reduce((s, b) => s + Number(b.payout_amount ?? 0), 0);
  const totalStake = userBets.reduce((s, b) => s + Number(b.stake_amount), 0);
  const net = totalPayout - totalStake;
  const hasBets = userBets.length > 0;
  const userWonMoney = net > 0;
  const userLostMoney = net < 0;
  const absNet = Math.abs(net);

  const resolvedLines = useMemo(() => {
    if (settlementMarkets.length > 0) {
      return settlementMarkets.map((m) =>
        marketResolvedPhrase(m.canonical_text, m.winner_side)
      );
    }
    const one = shortNarrative(winningOutcomeText, 160);
    return one ? [one] : [];
  }, [settlementMarkets, winningOutcomeText]);

  const explainBody = useMemo(() => {
    const narrative = shortNarrative(winningOutcomeText, 280);
    const extras = settlementMarkets
      .map((m) => m.explanation_short?.trim())
      .filter(Boolean) as string[];
    return { narrative, extras };
  }, [settlementMarkets, winningOutcomeText]);

  useEffect(() => {
    if (!userWonMoney) return;
    const timer = setTimeout(() => {
      setShowPayout(true);
      try {
        const ctx = new AudioContext();
        const playTone = (freq: number, startTime: number, dur: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.12, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
          osc.start(startTime);
          osc.stop(startTime + dur);
        };
        const now = ctx.currentTime;
        playTone(1200, now, 0.12);
        playTone(1600, now + 0.08, 0.12);
        playTone(2000, now + 0.16, 0.18);
      } catch {
        // ignore
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userWonMoney]);

  useEffect(() => {
    if (!showPayout) return;
    const t = setTimeout(() => setShowPayout(false), 2000);
    return () => clearTimeout(t);
  }, [showPayout]);

  const panelClass =
    "border border-white/12 bg-neutral-950 text-white shadow-[0_-8px_32px_rgba(0,0,0,0.55)]";

  const headline = !hasBets
    ? { word: "No bet", tone: "neutral" as const }
    : userWonMoney
      ? { word: "Won", tone: "win" as const }
      : userLostMoney
        ? { word: "Lost", tone: "loss" as const }
        : { word: "Even", tone: "neutral" as const };

  const amountColor =
    headline.tone === "win"
      ? "text-emerald-400/90"
      : headline.tone === "loss"
        ? "text-red-400/85"
        : "text-white/55";

  const characterInsight =
    userWonMoney &&
    characterName &&
    characterStats &&
    characterStats.settledCount >= 2 ? (
      <p className="mt-2 text-[11px] leading-snug text-white/50">
        You&apos;ve been right on{" "}
        <span className="font-medium text-white/70">{characterStats.winRatePct}%</span> of
        settled picks with{" "}
        <span className="font-medium text-white/70">{characterName}</span> (
        {characterStats.settledCount} total).
        {characterStats.currentWinStreak >= 2 ? (
          <>
            {" "}
            <span className="text-emerald-400/80">
              {characterStats.currentWinStreak} wins in a row
            </span>{" "}
            on them.
          </>
        ) : null}
      </p>
    ) : userWonMoney && characterName && characterStats?.settledCount === 1 ? (
      <p className="mt-2 text-[11px] text-white/50">
        First settled pick with <span className="font-medium text-white/70">{characterName}</span>
        — nice.
      </p>
    ) : null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex max-h-[48vh] flex-col justify-end">
      {showPayout && userWonMoney && (
        <div className="pointer-events-none absolute bottom-full left-0 right-0 mb-2 flex justify-center animate-in fade-in duration-300">
          <div className="rounded-full bg-emerald-600 px-5 py-2 text-lg font-bold text-white shadow-lg">
            +{formatCurrency(net)}
          </div>
        </div>
      )}

      {!sheetExpanded && (
        <button
          type="button"
          onClick={() => setSheetExpanded(true)}
          className={`pointer-events-auto flex w-full items-center gap-3 rounded-t-xl px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] touch-manipulation ${panelClass}`}
          aria-expanded={false}
          aria-label="Open resolution details"
        >
          <ChevronUp className="h-4 w-4 shrink-0 text-white/45" aria-hidden />
          <div className="min-w-0 flex-1 text-left">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
              <span
                className={
                  headline.tone === "win"
                    ? "text-base font-semibold text-emerald-400"
                    : headline.tone === "loss"
                      ? "text-base font-semibold text-red-400"
                      : "text-base font-semibold text-white/80"
                }
              >
                {headline.word}
              </span>
              {hasBets ? (
                <span className={`text-xs font-medium tabular-nums ${amountColor}`}>
                  {formatCurrency(absNet)}
                </span>
              ) : null}
            </div>
            {hasBets && userBets[0] ? (
              <p className="mt-0.5 truncate text-[11px] leading-tight text-white/50">
                {describeUserBet(userBets[0].side_key, marketCanonical(userBets[0]))}
                {userBets.length > 1 ? ` +${userBets.length - 1} more` : ""}
              </p>
            ) : (
              <p className="mt-0.5 text-[11px] text-white/45">Tap for what resolved</p>
            )}
          </div>
        </button>
      )}

      {sheetExpanded && (
        <div
          className={`pointer-events-auto flex max-h-[min(48vh,22rem)] flex-col rounded-t-xl ${panelClass}`}
        >
          <div className="flex shrink-0 items-center justify-end border-b border-white/10 px-2 py-1.5">
            <button
              type="button"
              onClick={() => {
                setSheetExpanded(false);
                setShowResolved(false);
                setShowExplain(false);
              }}
              className="rounded-md px-2 py-1 text-[11px] text-white/55 hover:bg-white/10 hover:text-white touch-manipulation"
              aria-label="Close resolution details"
            >
              Close
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span
                  className={
                    headline.tone === "win"
                      ? "text-lg font-semibold text-emerald-400"
                      : headline.tone === "loss"
                        ? "text-lg font-semibold text-red-400"
                        : "text-lg font-semibold text-white/85"
                  }
                >
                  {headline.word}
                </span>
                {hasBets ? (
                  <span className={`text-sm font-medium tabular-nums ${amountColor}`}>
                    {formatCurrency(absNet)}
                  </span>
                ) : null}
              </div>
              {characterInsight}
            </div>

            {hasBets && (
              <div className="space-y-1.5 border-t border-white/10 pt-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-white/35">
                  Your pick{userBets.length > 1 ? "s" : ""}
                </p>
                <ul className="space-y-1">
                  {userBets.map((b) => (
                    <li key={b.id} className="text-[12px] leading-snug text-white/75">
                      <span className="text-white/90">
                        {describeUserBet(b.side_key, marketCanonical(b))}
                      </span>
                      <span className="ml-1.5 text-[11px] text-white/40 tabular-nums">
                        {b.status === "settled_win"
                          ? `+${formatCurrency(Number(b.payout_amount ?? 0) - Number(b.stake_amount))}`
                          : b.status === "settled_loss"
                            ? `−${formatCurrency(Number(b.stake_amount))}`
                            : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border-t border-white/10 pt-1">
              <button
                type="button"
                onClick={() => setShowResolved((v) => !v)}
                className="flex w-full items-center justify-between py-2 text-left touch-manipulation"
              >
                <span className="text-[11px] font-medium text-white/55">
                  What the clip resolved to
                </span>
                {showResolved ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-white/40" aria-hidden />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-white/40" aria-hidden />
                )}
              </button>
              {showResolved && (
                <ul className="space-y-1 pb-2 pl-0.5">
                  {resolvedLines.map((line, i) => (
                    <li key={i} className="text-[12px] leading-snug text-white/80">
                      · {line}
                    </li>
                  ))}
                  {resolvedLines.length > 1 ? (
                    <li className="pt-1 text-[11px] text-white/45">
                      {resolvedLines.length} outcomes this clip.
                    </li>
                  ) : null}
                </ul>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowExplain((v) => !v)}
                className="flex w-full items-center justify-between py-2 text-left touch-manipulation"
              >
                <span className="text-[11px] font-medium text-white/55">Why and details</span>
                {showExplain ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-white/40" aria-hidden />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-white/40" aria-hidden />
                )}
              </button>
              {showExplain && (
                <div className="space-y-2 pb-2 text-[11px] leading-relaxed text-white/60">
                  {explainBody.narrative ? (
                    <p className="text-white/75">{explainBody.narrative}</p>
                  ) : null}
                  {explainBody.extras.length > 0 ? (
                    <ul className="list-none space-y-1">
                      {explainBody.extras.map((e, i) => (
                        <li key={i}>· {e}</li>
                      ))}
                    </ul>
                  ) : null}
                  {resolutionReasonText.trim() ? (
                    <p className="whitespace-pre-wrap text-white/50">
                      {resolutionReasonText.trim().length > 520
                        ? `${resolutionReasonText.trim().slice(0, 519)}…`
                        : resolutionReasonText.trim()}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
