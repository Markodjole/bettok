"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useFeedStore } from "@/stores/feed-store";
import { cn } from "@/lib/utils";
import { Play, Pause } from "lucide-react";

interface VideoPlayerProps {
  src: string | null;
  poster?: string | null;
  pauseStartMs?: number | null;
  durationMs?: number | null;
  isActive?: boolean;
  className?: string;
  onLoopEnd?: () => void;
  pausedByParent?: boolean;
}

export function VideoPlayer({
  src,
  poster,
  pauseStartMs,
  isActive = true,
  className,
  onLoopEnd,
  pausedByParent = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loopEndCalledRef = useRef(false);
  const prevTimeRef = useRef(0);
  const browserForcedMuteRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isExtremeLandscape, setIsExtremeLandscape] = useState(false);
  const isMuted = useFeedStore((s) => s.isMuted);
  const toggleMute = useFeedStore((s) => s.toggleMute);

  const tryPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
    video.play()
      .then(() => {
        setIsPlaying(true);
        browserForcedMuteRef.current = false;
      })
      .catch(() => {
        video.muted = true;
        browserForcedMuteRef.current = true;
        video.play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      });
  }, [isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (pausedByParent) {
      video.pause();
      setIsPlaying(false);
      return;
    }
    if (isActive) {
      tryPlay();
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive, pausedByParent, tryPlay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onCanPlay = () => {
      if (isActive && !pausedByParent && video.paused) {
        tryPlay();
      }
    };
    video.addEventListener("canplay", onCanPlay);
    return () => video.removeEventListener("canplay", onCanPlay);
  }, [isActive, pausedByParent, tryPlay]);

  // When user toggles mute button, sync to video element.
  // If browser had forced mute, clear it — user interaction unlocks audio.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    browserForcedMuteRef.current = false;
    video.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const video = videoRef.current;
      if (!video || !isActive || pausedByParent) return;
      if (video.readyState < 2) video.load();
      tryPlay();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const handleFocus = () => {
      const video = videoRef.current;
      if (!video || !isActive || pausedByParent) return;
      if (video.paused) tryPlay();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isActive, pausedByParent, tryPlay]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const t = video.currentTime;
    const prev = prevTimeRef.current;
    prevTimeRef.current = t;

    const pct = (t / video.duration) * 100;
    setProgress(isNaN(pct) ? 0 : pct);

    const atPausePoint = pauseStartMs && t * 1000 >= pauseStartMs;
    const atVideoEnd = !pauseStartMs && video.duration > 0 && t >= video.duration - 0.25;
    const justLooped = !pauseStartMs && prev > 1 && t < 0.5;

    if (atPausePoint) {
      if (!loopEndCalledRef.current) {
        loopEndCalledRef.current = true;
        onLoopEnd?.();
      }
      video.currentTime = 0;
    } else if (atVideoEnd || justLooped) {
      if (!loopEndCalledRef.current) {
        loopEndCalledRef.current = true;
        onLoopEnd?.();
      }
    } else if (t < 0.5) {
      loopEndCalledRef.current = false;
    }
  }, [pauseStartMs, onLoopEnd]);

  const handleTap = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // First tap after browser forced mute: just unmute, don't toggle play/pause.
    if (browserForcedMuteRef.current) {
      browserForcedMuteRef.current = false;
      video.muted = false;
      return;
    }

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const showControlsBriefly = useCallback(() => {
    setShowControls(true);
    if (controlsHideTimeoutRef.current) clearTimeout(controlsHideTimeoutRef.current);
    controlsHideTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
      controlsHideTimeoutRef.current = null;
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (controlsHideTimeoutRef.current) clearTimeout(controlsHideTimeoutRef.current);
    };
  }, []);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const toStorageUrl = (path: string | null | undefined) => {
    if (!path) return undefined;
    if (path.startsWith("http")) return path;
    return `${supabaseUrl}/storage/v1/object/public/media/${path.replace(/^\//, "")}`;
  };
  const fullSrc = toStorageUrl(src);
  const demoSrc =
    fullSrc ||
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
  const posterUrl = toStorageUrl(poster) ?? undefined;

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const ratio = video.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : 1;
    setIsExtremeLandscape(ratio > 1.3);
  }, []);

  return (
    <div
      className={cn("relative h-full w-full bg-black overflow-hidden", className)}
      onClick={() => {
        handleTap();
        showControlsBriefly();
      }}
    >
      <video
        ref={videoRef}
        src={demoSrc}
        poster={posterUrl}
        loop
        playsInline
        muted={isMuted}
        preload={isActive ? "auto" : "metadata"}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        className={cn(
          "h-full w-full object-contain",
          isExtremeLandscape && "scale-[1.25] origin-center"
        )}
      />

      <div className="absolute bottom-0 left-0 right-0 z-20 h-[4px] bg-white/15">
        <div
          className="h-full bg-white/80 rounded-r-full will-change-[width]"
          style={{ width: `${progress}%`, transition: "width 0.25s linear" }}
        />
        {pauseStartMs && (
          <div
            className="absolute top-1/2 -translate-y-1/2 h-[6px] w-[6px] rounded-full bg-warning"
            style={{ left: `${(pauseStartMs / ((videoRef.current?.duration || 10) * 1000)) * 100}%` }}
          />
        )}
      </div>

      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleTap();
            showControlsBriefly();
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
    </div>
  );
}
