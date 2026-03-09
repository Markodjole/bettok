"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useFeedStore } from "@/stores/feed-store";
import { cn } from "@/lib/utils";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";

interface VideoPlayerProps {
  src: string | null;
  poster?: string | null;
  pauseStartMs?: number | null;
  durationMs?: number | null;
  isActive?: boolean;
  className?: string;
}

export function VideoPlayer({
  src,
  poster,
  pauseStartMs,
  isActive = true,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const isMuted = useFeedStore((s) => s.isMuted);
  const toggleMute = useFeedStore((s) => s.toggleMute);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const pct = (video.currentTime / video.duration) * 100;
    setProgress(isNaN(pct) ? 0 : pct);

    if (pauseStartMs && video.currentTime * 1000 >= pauseStartMs) {
      video.currentTime = 0;
    }
  }, [pauseStartMs]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const demoSrc =
    src ||
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

  return (
    <div
      className={cn("relative h-full w-full bg-black", className)}
      onClick={() => setShowControls((s) => !s)}
    >
      <video
        ref={videoRef}
        src={demoSrc}
        poster={poster || undefined}
        loop
        playsInline
        muted={isMuted}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        className="h-full w-full object-cover"
      />

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
        <div
          className="h-full bg-primary transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Pause point marker */}
      {pauseStartMs && (
        <div
          className="absolute bottom-0 h-1 w-1 rounded-full bg-warning"
          style={{ left: `${(pauseStartMs / ((videoRef.current?.duration || 10) * 1000)) * 100}%` }}
        />
      )}

      {/* Controls overlay */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm"
        >
          {isPlaying ? (
            <Pause className="h-8 w-8 text-white" />
          ) : (
            <Play className="ml-1 h-8 w-8 text-white" />
          )}
        </button>
      </div>

      {/* Mute toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleMute();
        }}
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm"
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4 text-white" />
        ) : (
          <Volume2 className="h-4 w-4 text-white" />
        )}
      </button>
    </div>
  );
}
