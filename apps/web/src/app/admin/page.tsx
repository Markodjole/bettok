"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { createBrowserClient } from "@/lib/supabase/client";
import { useUserStore } from "@/stores/user-store";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  Film,
  TrendingUp,
  Wallet,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalClips: number;
  totalBets: number;
  totalMarkets: number;
  totalVolume: number;
  pendingReports: number;
}

export default function AdminPage() {
  const profile = useUserStore((s) => s.profile);
  const authLoading = useUserStore((s) => s.isLoading);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) loadStats();
  }, [authLoading]);

  async function loadStats() {
    setLoading(true);
    const supabase = createBrowserClient();

    const [users, clips, bets, markets, reports] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("clip_nodes").select("id", { count: "exact", head: true }),
      supabase.from("bets").select("id, stake_amount"),
      supabase.from("prediction_markets").select("id", { count: "exact", head: true }),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    const totalVolume = (bets.data || []).reduce(
      (sum, b) => sum + Number(b.stake_amount),
      0
    );

    setStats({
      totalUsers: users.count || 0,
      totalClips: clips.count || 0,
      totalBets: bets.data?.length || 0,
      totalMarkets: markets.count || 0,
      totalVolume,
      pendingReports: reports.count || 0,
    });
    setLoading(false);
  }

  if (profile?.role !== "admin" && profile?.role !== "moderator") {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">Access denied</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ScrollArea className="h-full">
        <div className="p-4 pb-8">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={loadStats}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Stats grid */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))
              : stats && (
                  <>
                    <StatCard
                      icon={Users}
                      label="Users"
                      value={stats.totalUsers}
                    />
                    <StatCard
                      icon={Film}
                      label="Clips"
                      value={stats.totalClips}
                    />
                    <StatCard
                      icon={TrendingUp}
                      label="Bets"
                      value={stats.totalBets}
                    />
                    <StatCard
                      icon={Wallet}
                      label="Volume"
                      value={formatCurrency(stats.totalVolume)}
                    />
                    <StatCard
                      icon={TrendingUp}
                      label="Markets"
                      value={stats.totalMarkets}
                    />
                    <StatCard
                      icon={AlertTriangle}
                      label="Reports"
                      value={stats.pendingReports}
                      highlight={stats.pendingReports > 0}
                    />
                  </>
                )}
          </div>

          <Tabs defaultValue="clips">
            <TabsList className="w-full">
              <TabsTrigger value="clips" className="flex-1">
                Clips
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex-1">
                Reports
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex-1">
                Jobs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clips" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Clip management coming soon...
              </p>
            </TabsContent>

            <TabsContent value="reports" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Moderation queue coming soon...
              </p>
            </TabsContent>

            <TabsContent value="jobs" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Job monitoring coming soon...
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-warning/50" : ""}>
      <CardContent className="flex items-center gap-3 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-lg font-bold">{value}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
