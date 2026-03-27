"use client";

import { useState, useEffect, useRef } from "react";
import { getClipComments } from "@/actions/prediction-comments";

interface ClipComment {
  id: string;
  body: string;
  parentCommentId: string | null;
  username: string;
}

const CYCLE_MS = 800;

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function CommentsFirstLoop({ clipId }: { clipId: string }) {
  const [comments, setComments] = useState<ClipComment[]>([]);
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getClipComments(clipId).then((data) => {
      setComments(data.map((c) => ({
        id: c.id,
        body: c.body,
        parentCommentId: c.parentCommentId,
        username: c.username,
      })));
    });
  }, [clipId]);

  useEffect(() => {
    if (comments.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIdx((prev) => (prev + 1) % comments.length);
    }, CYCLE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [comments.length]);

  if (comments.length === 0) return null;

  const c = comments[idx];

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      <div className="absolute left-3 right-3 top-3">
        <div
          key={`${c.id}-${idx}`}
          className="animate-[slideUp_0.25s_ease-out] rounded-lg bg-black/40 px-2.5 py-1.5 backdrop-blur-sm"
        >
          <div className="flex items-baseline gap-1">
            {c.parentCommentId && (
              <span className="text-[8px] text-white/25 shrink-0">↳</span>
            )}
            <span className="shrink-0 text-xs font-semibold text-primary/70">
              {c.username}
            </span>
            <span className="text-xs text-white/80 leading-tight line-clamp-1">
              {cap(c.body)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
