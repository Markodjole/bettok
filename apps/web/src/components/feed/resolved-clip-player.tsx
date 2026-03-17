"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useFeedStore } from "@/stores/feed-store";
import { getMediaUrl } from "@/lib/utils";
import { ResultOverlay } from "./result-overlay";
import { getUserBetsForClip } from "@/actions/bets";
import type { FeedClip } from "@/actions/clips";

const RESULT_DISPLAY_MS = 2000;

type Phase = "part1" | "part2" | "result";

interface ResolvedClipPlayerProps {
  clip: FeedClip;
  isActive: boolean;
}

export function ResolvedClipPlayer({ clip, isActive }: ResolvedClipPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>("part1");
  const [userBets, setUserBets] = useState<Array<Record<string, unknown>>>([]);
  const isMuted = useFeedStore((s) => s.isMuted);

  const part1Url = getMediaUrl(clip.video_storage_path) ?? "";
  const part2Url = getMediaUrl(clip.part2_video_storage_path ?? undefined) ?? "";
  const winningOutcome = clip.winning_outcome_text ?? "Settled";
  const resolutionReason = clip.resolution_reason_text ?? "Resolution complete.";

  useEffect(() => {
    if (clip.status !== "settled") return;
    getUserBetsForClip(clip.id).then(setUserBets);
  }, [clip.id, clip.status]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!isActive) {
      video.pause();
      setPhase("part1");
      return;
    }
    if (phase === "part1") {
      video.src = part1Url;
      video.currentTime = 0;
      video.play().catch(() => {});
    } else if (phase === "part2" && part2Url) {
      video.src = part2Url;
      video.currentTime = 0;
      const onCanPlay = () => {
        video.play().catch(() => {});
      };
      video.addEventListener("canplay", onCanPlay, { once: true });
      video.load();
      return () => video.removeEventListener("canplay", onCanPlay);
    }
  }, [isActive, phase, part1Url, part2Url]);

  useEffect(() => {
    if (phase !== "result") return;
    const t = setTimeout(() => setPhase("part1"), RESULT_DISPLAY_MS);
    return () => clearTimeout(t);
  }, [phase]);

  const handleEnded = useCallback(() => {
    setPhase((p) => {
      if (p === "part1") return "part2";
      if (p === "part2") return "result";
      return p;
    });
  }, []);

  if (!part2Url) return null;

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={videoRef}
        src={phase === "part2" ? part2Url : part1Url}
        playsInline
        muted={isMuted}
        preload="auto"
        onEnded={handleEnded}
        className="h-full w-full object-contain"
      />

      {/* Subtle grey tint over Part 1 (pre-resolution) */}
      {phase === "part1" && (
        <div
          className="absolute inset-0 z-[1] bg-black/25 pointer-events-none"
          aria-hidden
        />
      )}

      {/* RESOLUTION label at top while Part 2 plays (no overlay, no pause) */}
      {phase === "part2" && (
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-center pt-8 pointer-events-none" aria-hidden>
          <span className="text-lg font-bold tracking-widest text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            RESOLUTION
          </span>
        </div>
      )}

      {phase === "result" && (
        <ResultOverlay
          winningOutcomeText={winningOutcome}
          resolutionReasonText={resolutionReason}
          userBets={userBets as Array<{ id: string; side_key: string; stake_amount: number; payout_amount: number | null; status: string }>}
        />
      )}
    </div>
  );
}
