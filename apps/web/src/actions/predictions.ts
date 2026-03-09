"use server";

import { createServerClient, createServiceClient } from "@/lib/supabase/server";
import { mockNormalize } from "@bettok/story-engine";

export async function submitPrediction(input: {
  clip_node_id: string;
  raw_text: string;
}) {
  const supabase = await createServerClient();
  const serviceClient = await createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!input.raw_text || input.raw_text.length < 3) {
    return { error: "Prediction must be at least 3 characters" };
  }

  if (input.raw_text.length > 300) {
    return { error: "Prediction must be 300 characters or less" };
  }

  const { data: clipNode } = await supabase
    .from("clip_nodes")
    .select("status")
    .eq("id", input.clip_node_id)
    .single();

  if (!clipNode || clipNode.status !== "betting_open") {
    return { error: "Betting is not open for this clip" };
  }

  const normalized = mockNormalize(input.raw_text);

  const { data: existing } = await supabase
    .from("prediction_markets")
    .select("id")
    .eq("clip_node_id", input.clip_node_id)
    .eq("market_key", normalized.market_key)
    .single();

  if (existing) {
    return { data: existing, merged: true };
  }

  const { data: market, error: marketError } = await serviceClient
    .from("prediction_markets")
    .insert({
      clip_node_id: input.clip_node_id,
      raw_creator_input: input.raw_text,
      canonical_text: normalized.canonical_text,
      market_key: normalized.market_key,
      normalization_confidence: normalized.confidence,
      normalization_explanation: normalized.explanation,
      created_by_user_id: user.id,
      status: "open",
    })
    .select()
    .single();

  if (marketError) return { error: "Failed to create market" };

  const yesProbability = 0.5;
  const noProbability = 0.5;

  await serviceClient.from("market_sides").insert([
    {
      prediction_market_id: market.id,
      side_key: "yes",
      current_odds_decimal: Math.round((1 / yesProbability) * 100) / 100,
      probability: yesProbability,
    },
    {
      prediction_market_id: market.id,
      side_key: "no",
      current_odds_decimal: Math.round((1 / noProbability) * 100) / 100,
      probability: noProbability,
    },
  ]);

  await serviceClient
    .from("profiles")
    .update({
      total_predictions: (
        await supabase
          .from("profiles")
          .select("total_predictions")
          .eq("id", user.id)
          .single()
      ).data?.total_predictions + 1 || 1,
    })
    .eq("id", user.id);

  return { data: market, merged: false };
}
