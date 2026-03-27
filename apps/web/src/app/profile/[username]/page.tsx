import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { createServerClient } from "@/lib/supabase/server";
import { formatRelativeTime } from "@/lib/utils";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const supabase = await createServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, total_predictions, total_bets, total_wins")
    .eq("username", decodedUsername)
    .single();

  if (!profile) {
    notFound();
  }

  const { data: predictions } = await supabase
    .from("prediction_markets")
    .select(
      `
      id,
      canonical_text,
      created_at,
      clip_node_id,
      market_sides(side_key, current_odds_decimal),
      clip_nodes(id, status, stories(title))
    `,
    )
    .eq("created_by_user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <AppShell>
      <div className="h-full overflow-y-auto p-4 space-y-4">
        <div className="rounded-xl bg-card border border-border p-4">
          <p className="text-lg font-semibold">{profile.display_name}</p>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span>Predictions: {profile.total_predictions ?? 0}</span>
            <span>Bets: {profile.total_bets ?? 0}</span>
            <span>Wins: {profile.total_wins ?? 0}</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Previous predictions</p>
          {(predictions || []).length === 0 ? (
            <div className="rounded-lg bg-card border border-border p-3 text-sm text-muted-foreground">
              No predictions yet.
            </div>
          ) : (
            (predictions || []).map((prediction: any) => {
              const yesOdds = (prediction.market_sides || []).find((s: any) => s.side_key === "yes");
              const noOdds = (prediction.market_sides || []).find((s: any) => s.side_key === "no");
              const storyTitle = prediction.clip_nodes?.stories?.title || "Clip";

              return (
                <Link
                  key={prediction.id}
                  href={`/clip/${prediction.clip_node_id}`}
                  className="block rounded-lg bg-card border border-border p-3 hover:bg-accent/30 transition"
                >
                  <p className="text-sm font-medium text-foreground">{prediction.canonical_text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{storyTitle}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>Yes {yesOdds?.current_odds_decimal?.toFixed?.(2) ?? "-"}</span>
                    <span>No {noOdds?.current_odds_decimal?.toFixed?.(2) ?? "-"}</span>
                    <span>{formatRelativeTime(prediction.created_at)}</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
