"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getPredictionComments, postPredictionComment } from "@/actions/prediction-comments";
import { Send, Reply, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  parentCommentId: string | null;
  username: string;
  displayName: string;
}

interface PredictionThreadProps {
  predictionMarketId: string;
  visible: boolean;
  mode?: "compact" | "expanded";
  onInteract?: () => void;
  onComposeChange?: (isComposing: boolean) => void;
}

const POLL_MS = 3000;

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function PredictionThread({
  predictionMarketId,
  visible,
  mode = "compact",
  onInteract,
  onComposeChange,
}: PredictionThreadProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seenIds = useRef(new Set<string>());
  const [newIds, setNewIds] = useState(new Set<string>());
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchComments = useCallback(async () => {
    const data = await getPredictionComments(predictionMarketId);
    const reversed = [...data].reverse();

    const freshIds = new Set<string>();
    for (const c of reversed) {
      if (!seenIds.current.has(c.id)) freshIds.add(c.id);
      seenIds.current.add(c.id);
    }
    if (freshIds.size > 0) setNewIds(freshIds);

    setComments(reversed);
  }, [predictionMarketId]);

  useEffect(() => {
    if (!visible) return;
    fetchComments();
    if (mode === "expanded") return;
    pollRef.current = setInterval(fetchComments, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [visible, fetchComments, mode]);

  useEffect(() => {
    if (newIds.size === 0) return;
    const timer = setTimeout(() => setNewIds(new Set()), 600);
    return () => clearTimeout(timer);
  }, [newIds]);

  function handleReply(comment: Comment) {
    setReplyingTo({ id: comment.id, username: comment.username });
    setShowInput(true);
    onInteract?.();
    onComposeChange?.(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function cancelReply() {
    setReplyingTo(null);
  }

  async function handleSend() {
    if (!input.trim() || sending) return;
    setSending(true);
    const res = await postPredictionComment(
      predictionMarketId,
      input.trim(),
      replyingTo?.id ?? null,
    );
    setSending(false);
    if (res.error) {
      toast({ title: "Comment failed", description: res.error, variant: "destructive" });
      return;
    }
    if (res.data) {
      setInput("");
      setShowInput(false);
      setReplyingTo(null);
      onComposeChange?.(false);
      setComments((prev) => [...prev, res.data!]);
      seenIds.current.add(res.data.id);
      setNewIds(new Set([res.data.id]));
    }
  }

  if (!visible) return null;

  function threadOrder(list: Comment[]): Comment[] {
    const byParent = new Map<string | null, Comment[]>();
    for (const c of list) {
      const key = c.parentCommentId ?? null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(c);
    }
    const result: Comment[] = [];
    function walk(parentId: string | null) {
      const children = byParent.get(parentId);
      if (!children) return;
      for (const c of children) {
        result.push(c);
        walk(c.id);
      }
    }
    walk(null);
    return result;
  }

  const allChronological = threadOrder([...comments].reverse());
  const commentById = new Map(allChronological.map((c) => [c.id, c]));

  function getReplyDepth(comment: Comment): number {
    let depth = 0;
    let currentParentId = comment.parentCommentId;
    while (currentParentId && depth < 6) {
      const parent = commentById.get(currentParentId);
      if (!parent) break;
      depth += 1;
      currentParentId = parent.parentCommentId;
    }
    return depth;
  }

  return (
    <div
      className="pointer-events-auto mt-1.5 space-y-1"
      onClick={() => onInteract?.()}
      onPointerDown={() => onInteract?.()}
    >
      {mode === "expanded" ? (
        <>
          {allChronological.length > 0 && (
            <div className="space-y-1">
              <div className="space-y-1">
                {allChronological.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-1"
                    style={{ marginLeft: `${getReplyDepth(c) * 10}px` }}
                  >
                    {c.parentCommentId && (
                      <span className="text-[8px] text-white/25 shrink-0 mt-0.5">↳</span>
                    )}
                    <span className="shrink-0 text-xs font-semibold text-primary/70">
                      {c.username}
                    </span>
                    <span className="flex-1 text-xs text-white/80 leading-snug whitespace-normal break-words">
                      {cap(c.body)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReply(c);
                      }}
                      className="shrink-0 p-0.5 text-white/45 hover:text-white/85 transition touch-manipulation"
                      aria-label="Reply"
                    >
                      <Reply className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {comments.length > 0 && (() => {
            const latest = allChronological[allChronological.length - 1];
            return (
              <div className="flex items-baseline gap-1">
                <span className="shrink-0 text-xs font-semibold text-primary/70">
                  {latest.username}
                </span>
                <span className="flex-1 text-xs text-white/80 leading-tight truncate">
                  {cap(latest.body)}
                </span>
                {comments.length > 1 && (
                  <span className="shrink-0 text-[10px] text-white/40">
                    …{comments.length}
                  </span>
                )}
              </div>
            );
          })()}
        </>
      )}

      {mode === "expanded" && (
        showInput ? (
          <div onClick={(e) => e.stopPropagation()}>
            {replyingTo && (
              <div className="flex items-center gap-1 px-0.5 mb-0.5">
                <span className="text-[8px] text-primary/60">
                  @{replyingTo.username}
                </span>
                <button
                  type="button"
                  onClick={cancelReply}
                  className="text-white/30 hover:text-white/60 touch-manipulation"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            )}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-1"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => { onInteract?.(); onComposeChange?.(true); }}
                placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Say something..."}
                maxLength={280}
                autoFocus
                className="flex-1 rounded bg-transparent border-b border-white/15 px-0.5 py-0.5 text-xs text-white placeholder:text-white/25 outline-none focus:border-primary/40"
                onBlur={() => {
                  if (!input.trim()) {
                    setTimeout(() => {
                      setShowInput(false);
                      setReplyingTo(null);
                      onComposeChange?.(false);
                    }, 200);
                  }
                }}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-white/60 hover:text-primary disabled:opacity-30 touch-manipulation"
              >
                <Send className="h-3 w-3" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex justify-start mt-2 px-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setReplyingTo(null);
                setShowInput(true);
                onComposeChange?.(true);
                onInteract?.();
              }}
              className="text-xs font-medium text-white/60 hover:text-white transition touch-manipulation"
            >
              Comment
            </button>
          </div>
        )
      )}
    </div>
  );
}
