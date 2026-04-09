"use server";

import { createServerClient } from "@/lib/supabase/server";
import { getCharacterById } from "./characters";
import { characterToPromptContext } from "@/lib/characters/types";

export type CharacterClipAiOption = {
  description: string;
  cliffhangers: string[];
};

const ACTION_MAX = 900;
const CLIFF_MAX = 400;
const OPTIONS_COUNT = 4;
const CLIFFS_PER_OPTION = 3;

/**
 * LLM-generated movement + cliffhanger pairs for /create (character mode).
 * Uses the same behavioral rules as video generation (Kling / compose frame).
 */
export async function suggestCharacterClipIdeas(input: {
  characterId: string;
  locationDescription: string;
  mood?: string;
  camera?: string;
}): Promise<{ data?: { options: CharacterClipAiOption[] }; error?: string }> {
  const location = (input.locationDescription || "").trim();
  if (!location) return { error: "Add a location first" };

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { character, error: charErr } = await getCharacterById(input.characterId);
  if (charErr || !character || !character.active) {
    return { error: "Character not found" };
  }
  if (character.creator_user_id && character.creator_user_id !== user.id) {
    return { error: "You cannot use this character" };
  }

  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey || process.env.LLM_PROVIDER !== "openai") {
    return { error: "AI suggestions require LLM_PROVIDER=openai and LLM_API_KEY" };
  }

  const model =
    process.env.LLM_MODEL_CHARACTER_CLIP_SUGGEST ||
    process.env.LLM_MODEL_IMAGE_PATTERNS ||
    process.env.LLM_MODEL ||
    "gpt-4o-mini";

  const ctx = characterToPromptContext(character);
  const mood = (input.mood || "neutral").trim();
  const camera = (input.camera || "auto").trim();

  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });

  const system = `You write SHORT scene snippets for AI video (Kling image-to-video). The app will:
- Send LOCATION separately to an image composer (do NOT repeat the full setting as an opening clause).
- Use your "description" as the main movement/plot field for scene 1 style beats.
- Use one "cliffhanger" as the optional ending beat (visible dilemma, no resolution).

CHARACTER DATA (behavior is law — do not invent a new personality or job for them):
${ctx}

RULES:
1. LOCATION CONTEXT (user-supplied, do not re-copy as a sentence opener): The user already entered where this happens. Each "description" must clearly take place IN that setting using props, surfaces, light, objects — but do NOT start with "In [place]…" or "At the [place]…". Start with ${character.name} or an action (e.g. "${character.name} pauses…").
2. MOVEMENT: Max 1–2 clear physical actions per description; normal speed; readable in ~6–10s total video. Match energy, gestures, pace, and red flags from PHYSICAL BEHAVIOR.
3. STORY: External situation can happen TO them; reactions stay in-character. No random genre flip.
4. CLIFFHANGERS: Each is a frozen beat or two-way choice — hand hovering, two objects, door half-open, unread message, etc. No outcome. No speech, murmurs, or dialogue.
5. CONCRETE: Specific objects, surfaces, lighting. Avoid vague poetry.
6. VARIETY: The ${OPTIONS_COUNT} options should feel meaningfully different (social pressure, object choice, timing, interpersonal, environmental).
7. MOOD/CAMERA HINTS (optional): User mood=${mood}, camera=${camera}. If mood is not neutral, bias pacing/tension. If camera is not auto, hint framing only inside description (still no "the camera" meta-narration — describe what we see).

OUTPUT: JSON only, no markdown:
{
  "options": [
    {
      "description": "string",
      "cliffhangers": ["string", "string", "string"]
    }
  ]
}
Return exactly ${OPTIONS_COUNT} options; each exactly ${CLIFFS_PER_OPTION} cliffhangers.`;

  const userMsg = `LOCATION (already chosen by user — weave into action, do not open with it):\n${location}\n\nGenerate the JSON.`;

  try {
    const res = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      temperature: 0.55,
      max_tokens: 2800,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
    });

    const raw = res.choices[0]?.message?.content;
    if (!raw) return { error: "Empty model response" };

    const parsed = JSON.parse(raw) as { options?: unknown };
    const rawOpts = Array.isArray(parsed.options) ? parsed.options : [];

    const options: CharacterClipAiOption[] = [];
    for (const row of rawOpts) {
      if (typeof row !== "object" || row === null) continue;
      const r = row as Record<string, unknown>;
      const desc =
        typeof r.description === "string" ? r.description.trim().slice(0, ACTION_MAX) : "";
      const cliffsRaw = Array.isArray(r.cliffhangers) ? r.cliffhangers : [];
      const cliffhangers = cliffsRaw
        .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
        .map((c) => c.trim().slice(0, CLIFF_MAX))
        .slice(0, CLIFFS_PER_OPTION);
      if (desc && cliffhangers.length >= 1) {
        options.push({ description: desc, cliffhangers });
      }
    }

    if (options.length === 0) {
      return { error: "Could not parse valid suggestions" };
    }

    return { data: { options } };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Suggestion failed";
    return { error: msg };
  }
}
