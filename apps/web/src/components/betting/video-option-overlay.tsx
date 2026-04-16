"use client";

import { useState, useRef, useCallback } from "react";
import type { NormalizedBox } from "@/lib/frame-options/types";
import { cn } from "@/lib/utils";

export interface OverlayOption {
  id: string;
  label: string;
  shortLabel?: string | null;
  normalizedBox: NormalizedBox;
  isSelected?: boolean;
}

interface VideoOptionOverlayProps {
  src: string;
  options: OverlayOption[];
  mode: "display" | "picker" | "betting";
  selectedOptionId?: string | null;
  onOptionTap?: (id: string) => void;
  className?: string;
}

export function VideoOptionOverlay({
  src,
  options,
  mode,
  selectedOptionId,
  onOptionTap,
  className,
}: VideoOptionOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleTap = useCallback(
    (id: string) => {
      onOptionTap?.(id);
    },
    [onOptionTap],
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative select-none overflow-hidden", className)}
    >
      <img
        src={src}
        alt="Freeze frame"
        className="h-full w-full object-contain"
        onLoad={() => setImageLoaded(true)}
        draggable={false}
      />

      {imageLoaded &&
        options.map((opt) => (
          <HotspotButton
            key={opt.id}
            option={opt}
            mode={mode}
            isActive={selectedOptionId === opt.id}
            onTap={handleTap}
          />
        ))}
    </div>
  );
}

function HotspotButton({
  option,
  mode,
  isActive,
  onTap,
}: {
  option: OverlayOption;
  mode: "display" | "picker" | "betting";
  isActive: boolean;
  onTap: (id: string) => void;
}) {
  const { normalizedBox: box, label, shortLabel, isSelected } = option;
  const displayLabel = shortLabel || label;

  const isPicker = mode === "picker";
  const isBetting = mode === "betting";
  const isPickerSelected = isPicker && isSelected;
  const isBettingActive = isBetting && isActive;

  return (
    <button
      type="button"
      onClick={() => onTap(option.id)}
      className={cn(
        "absolute transition-all duration-200 touch-manipulation group",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      )}
      style={{
        left: `${box.x * 100}%`,
        top: `${box.y * 100}%`,
        width: `${box.width * 100}%`,
        height: `${box.height * 100}%`,
      }}
      aria-label={`${mode === "betting" ? "Bet on" : "Select"} ${label}`}
    >
      {/* Box outline */}
      <div
        className={cn(
          "absolute inset-0 rounded-lg border-2 transition-all duration-200",
          isPicker && isPickerSelected
            ? "border-primary bg-primary/15 shadow-[0_0_12px_rgba(var(--primary-rgb,99,102,241),0.4)]"
            : isPicker
              ? "border-white/50 bg-white/5 hover:border-white/80 hover:bg-white/10"
              : isBettingActive
                ? "border-emerald-400 bg-emerald-400/20 shadow-[0_0_16px_rgba(52,211,153,0.5)]"
                : isBetting
                  ? "border-white/40 bg-black/10 hover:border-white/70 hover:bg-white/10 active:bg-white/20"
                  : "border-white/30 bg-transparent",
        )}
      />

      {/* Label pill */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 whitespace-nowrap",
          "rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight",
          "shadow-md backdrop-blur-sm transition-all duration-200",
          box.y > 0.15 ? "-top-5" : "top-full mt-1",
          isPicker && isPickerSelected
            ? "bg-primary text-primary-foreground"
            : isPicker
              ? "bg-black/60 text-white/90 group-hover:bg-black/80"
              : isBettingActive
                ? "bg-emerald-500 text-white"
                : isBetting
                  ? "bg-black/55 text-white/90 group-hover:bg-black/75"
                  : "bg-black/50 text-white/80",
        )}
      >
        {displayLabel}
      </div>

      {/* Dot indicator for picker mode */}
      {isPicker && (
        <div
          className={cn(
            "absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white shadow-sm transition-all",
            isPickerSelected ? "bg-primary scale-110" : "bg-black/40",
          )}
        >
          {isPickerSelected && (
            <svg
              className="h-full w-full text-white p-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      )}
    </button>
  );
}
