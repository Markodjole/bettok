"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatRelativeTime } from "@/lib/utils";
import { createBrowserClient } from "@/lib/supabase/client";
import { useUserStore } from "@/stores/user-store";
import { GitBranch, Play, ChevronRight } from "lucide-react";

interface StoryNode {
  id: string;
  depth: number;
  status: string;
  scene_summary: string | null;
  parent_clip_node_id: string | null;
  published_at: string | null;
  bet_count: number;
  view_count: number;
}

export default function StoryPage() {
  const { id } = useParams<{ id: string }>();
  const authLoading = useUserStore((s) => s.isLoading);
  const [story, setStory] = useState<Record<string, unknown> | null>(null);
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    async function load() {
      const supabase = createBrowserClient();

      const [storyRes, nodesRes] = await Promise.all([
        supabase.from("stories").select("*").eq("id", id).single(),
        supabase
          .from("clip_nodes")
          .select("id, depth, status, scene_summary, parent_clip_node_id, published_at, bet_count, view_count")
          .eq("story_id", id)
          .order("depth", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

      setStory(storyRes.data);
      setNodes((nodesRes.data || []) as StoryNode[]);
      setLoading(false);
    }
    load();
  }, [id, authLoading]);

  if (loading) {
    return (
      <AppShell>
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (!story) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">Story not found</p>
        </div>
      </AppShell>
    );
  }

  const maxDepth = Math.max(...nodes.map((n) => n.depth), 0);

  return (
    <AppShell>
      <ScrollArea className="h-full">
        <div className="p-4 pb-8">
          <div className="mb-4">
            <h1 className="text-xl font-bold">{story.title as string}</h1>
            <p className="text-sm text-muted-foreground">
              {nodes.length} clip{nodes.length !== 1 ? "s" : ""} · {maxDepth} deep
            </p>
          </div>

          {/* Story tree visualization */}
          <div className="space-y-2">
            {nodes.map((node, index) => (
              <Link key={node.id} href={`/clip/${node.id}`}>
                <Card
                  className={cn(
                    "transition-colors hover:border-primary/50",
                    node.status === "betting_open" && "border-primary/30"
                  )}
                  style={{ marginLeft: `${node.depth * 16}px` }}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    {/* Depth indicator */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      {node.depth === 0 ? (
                        <Play className="h-3 w-3 text-primary" />
                      ) : (
                        <GitBranch className="h-3 w-3 text-primary" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {node.scene_summary || `Scene ${index + 1}`}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>Depth {node.depth}</span>
                        <span>·</span>
                        <span>{node.bet_count} bets</span>
                        {node.published_at && (
                          <>
                            <span>·</span>
                            <span>{formatRelativeTime(node.published_at)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          node.status === "betting_open"
                            ? "default"
                            : node.status === "settled"
                              ? "success"
                              : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {node.status.replace(/_/g, " ")}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </ScrollArea>
    </AppShell>
  );
}
