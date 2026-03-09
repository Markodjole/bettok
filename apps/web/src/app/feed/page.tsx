import { getFeedClips } from "@/actions/clips";
import { FeedShell } from "@/components/feed/feed-shell";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const { clips } = await getFeedClips();

  return (
    <AppShell>
      <FeedShell initialClips={clips} />
    </AppShell>
  );
}
