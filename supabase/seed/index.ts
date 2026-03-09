/**
 * Seed script for local development.
 * Creates sample stories, clips, markets, and bets.
 *
 * Run: pnpm db:seed (requires supabase running locally)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log("Seeding database...");

  const { data: user1 } = await supabase.auth.admin.createUser({
    email: "demo@bettok.app",
    password: "demo1234",
    email_confirm: true,
    user_metadata: { username: "demo_user", display_name: "Demo User" },
  });

  const { data: user2 } = await supabase.auth.admin.createUser({
    email: "creator@bettok.app",
    password: "creator1234",
    email_confirm: true,
    user_metadata: { username: "story_creator", display_name: "Story Creator" },
  });

  if (!user1?.user || !user2?.user) {
    console.log("Users may already exist, continuing...");
    return;
  }

  const creatorId = user2.user.id;

  const sampleStories = [
    {
      title: "Wolf vs Dog: The Forest Showdown",
      genre: "action",
      tone: "tense",
    },
    {
      title: "Mystery at Midnight Café",
      genre: "mystery",
      tone: "dark",
    },
    {
      title: "The Last Delivery Driver",
      genre: "comedy",
      tone: "humorous",
    },
  ];

  for (const story of sampleStories) {
    const { data: storyData } = await supabase
      .from("stories")
      .insert({
        ...story,
        creator_user_id: creatorId,
      })
      .select()
      .single();

    if (!storyData) continue;

    const { data: clip } = await supabase
      .from("clip_nodes")
      .insert({
        story_id: storyData.id,
        creator_user_id: creatorId,
        source_type: "upload",
        status: "betting_open",
        scene_summary: `Opening scene of "${story.title}"`,
        genre: story.genre,
        tone: story.tone,
        duration_ms: 15000,
        pause_start_ms: 12000,
        published_at: new Date().toISOString(),
        betting_deadline: new Date(
          Date.now() + 30 * 60 * 1000
        ).toISOString(),
      })
      .select()
      .single();

    if (!clip) continue;

    await supabase
      .from("stories")
      .update({ root_clip_node_id: clip.id })
      .eq("id", storyData.id);

    const predictions = [
      { raw: "The wolf attacks first", key: "wolf_attacks_first" },
      { raw: "Dog runs away", key: "dog_runs_away" },
      { raw: "A third animal appears", key: "third_animal_appears" },
    ];

    if (story.genre === "action") {
      for (const pred of predictions) {
        const { data: market } = await supabase
          .from("prediction_markets")
          .insert({
            clip_node_id: clip.id,
            raw_creator_input: pred.raw,
            canonical_text: pred.raw,
            market_key: pred.key,
            normalization_confidence: 0.9,
            created_by_user_id: creatorId,
            status: "open",
          })
          .select()
          .single();

        if (!market) continue;

        const prob = 0.3 + Math.random() * 0.4;
        await supabase.from("market_sides").insert([
          {
            prediction_market_id: market.id,
            side_key: "yes",
            current_odds_decimal: Math.round((1 / prob) * 100) / 100,
            probability: prob,
            pool_amount: Math.round(Math.random() * 200),
          },
          {
            prediction_market_id: market.id,
            side_key: "no",
            current_odds_decimal:
              Math.round((1 / (1 - prob)) * 100) / 100,
            probability: 1 - prob,
            pool_amount: Math.round(Math.random() * 200),
          },
        ]);
      }
    }
  }

  console.log("Seed complete!");
}

seed().catch(console.error);
