import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const history = Array.isArray(body?.messages)
      ? body.messages
          .filter(
            (m: unknown) =>
              m &&
              typeof m === "object" &&
              ["user", "assistant"].includes(String((m as { role?: unknown }).role)) &&
              typeof (m as { content?: unknown }).content === "string",
          )
          .slice(-12)
          .map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content.slice(0, 1200),
          }))
      : [];

    if (history.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const service = await createServiceClient();
    const [{ data: character }, { data: events }] = await Promise.all([
      service.from("characters").select("*").eq("id", id).single(),
      service
        .from("character_trait_events")
        .select("action_taken, created_at, trait_tags, context")
        .eq("character_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    const apiKey = process.env.LLM_API_KEY;
    if (!apiKey || process.env.LLM_PROVIDER !== "openai") {
      return NextResponse.json({
        answer: `${character.name}: ${character.tagline ?? "no tagline"}`,
      });
    }

    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });

    const res = await client.chat.completions.create({
      model: process.env.LLM_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that knows everything about the character "${character.name}". Answer naturally like a normal chatbot. Only use the data provided below — do not make things up. If the data doesn't cover something, say so honestly.

CHARACTER: ${character.name}
TAGLINE: ${character.tagline ?? ""}

APPEARANCE:
${JSON.stringify(character.appearance, null, 1)}

PERSONALITY:
${JSON.stringify(character.personality, null, 1)}

PREFERENCES:
${JSON.stringify(character.preferences, null, 1)}

BETTING SIGNALS:
${JSON.stringify(character.betting_signals ?? {}, null, 1)}

STATS: ${character.total_videos} videos, ${character.total_resolutions} resolutions, ${character.total_bets_received} bets received

BACKSTORY: ${character.backstory ?? "none"}

RECENT BEHAVIOR (from resolved videos):
${(events ?? []).map((e) => `- ${e.action_taken} (${e.created_at})`).join("\n") || "none yet"}`,
        },
        ...history,
      ],
    });

    const answer = res.choices[0]?.message?.content?.trim() || "No response.";
    return NextResponse.json({ answer });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Failed" },
      { status: 500 },
    );
  }
}
