"use server";

import { createServerClient, createServiceClient } from "@/lib/supabase/server";
import type {
  FrameOptionCandidate,
  FrameOptionRow,
  NormalizedBox,
} from "@/lib/frame-options/types";
import { saveFrameOptionsPayloadSchema, rowToCandidate } from "@/lib/frame-options/types";

// ─── Detection via GPT-4o vision ─────────────────────────────────────────────

const DETECTION_MODEL =
  process.env.LLM_MODEL_FRAME_DETECT ||
  process.env.LLM_MODEL_VISION ||
  process.env.LLM_MODEL ||
  "gpt-4o-mini";

/**
 * Detect betting-relevant objects in a single frame image.
 * Returns normalized bounding boxes + labels.
 */
export async function detectFrameOptions(input: {
  /** base64-encoded JPEG of the freeze frame */
  frameBase64: string;
  /** Outcomes already inferred (helps focus detection) */
  outcomes?: string[];
  /** Character name (for better prompts) */
  characterName?: string;
}): Promise<{
  candidates: FrameOptionCandidate[];
  error?: string;
}> {
  try {
    const apiKey = process.env.LLM_API_KEY;
    if (!apiKey || process.env.LLM_PROVIDER !== "openai") {
      return { candidates: [], error: "LLM not configured" };
    }

    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });

    const outcomesHint = input.outcomes?.length
      ? `\nThe predicted outcomes for this clip are:\n${input.outcomes.map((o, i) => `${i + 1}. ${o}`).join("\n")}\nFocus on objects related to these outcomes.`
      : "";

    const charHint = input.characterName
      ? `The main character is "${input.characterName}".`
      : "";

    const res = await client.chat.completions.create({
      model: DETECTION_MODEL,
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `You detect objects in images for a social video betting app. Users tap objects on screen to place bets.

Return JSON with a single "objects" array. Each object has:
- label: human-readable name (e.g. "Water bottle", "Red shoe")
- shortLabel: 1-3 word compact version (e.g. "Water", "Red shoe")
- objectType: category (food, drink, clothing, container, tool, furniture, animal, person, other)
- confidence: 0-1 how certain you are this object is present and correctly located
- box: { x, y, width, height } all as fractions of image dimensions (0 to 1). x,y is top-left corner.

Rules:
- Focus on objects a viewer could BET ON (things the character might pick, choose, interact with)
- Skip background/structural elements (walls, floor, ceiling) unless they are a choice
- Boxes must be reasonably tight around the object
- 3-12 candidates max, ranked by betting relevance
- Minimum box size: 3% width AND 3% height
- If multiple similar objects cluster (e.g. 5 bottles on a shelf), group them or pick the most prominent
- Include the main character/person as one candidate if visible`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Detect tappable betting objects in this freeze frame from a setup video.
${charHint}${outcomesHint}

Return the objects array with bounding boxes as fractions (0 to 1) of image width/height.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${input.frameBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
    });

    const raw = res.choices[0]?.message?.content?.trim();
    if (!raw) return { candidates: [], error: "Empty response from vision model" };

    const parsed = JSON.parse(raw) as {
      objects?: Array<{
        label?: string;
        shortLabel?: string;
        short_label?: string;
        objectType?: string;
        object_type?: string;
        confidence?: number;
        box?: { x?: number; y?: number; width?: number; height?: number };
      }>;
    };

    if (!Array.isArray(parsed.objects)) {
      return { candidates: [], error: "No objects array in response" };
    }

    const candidates: FrameOptionCandidate[] = [];
    for (let i = 0; i < parsed.objects.length && i < 12; i++) {
      const obj = parsed.objects[i];
      if (!obj?.label || !obj?.box) continue;

      const box: NormalizedBox = {
        x: clamp(obj.box.x ?? 0, 0, 1),
        y: clamp(obj.box.y ?? 0, 0, 1),
        width: clamp(obj.box.width ?? 0.05, 0.03, 1),
        height: clamp(obj.box.height ?? 0.05, 0.03, 1),
      };

      if (box.x + box.width > 1) box.width = 1 - box.x;
      if (box.y + box.height > 1) box.height = 1 - box.y;
      if (box.width < 0.03 || box.height < 0.03) continue;

      candidates.push({
        tempId: `det_${i}`,
        label: String(obj.label).slice(0, 80),
        shortLabel: String(obj.shortLabel ?? obj.short_label ?? obj.label)
          .slice(0, 32) || null,
        objectType: String(obj.objectType ?? obj.object_type ?? "other").slice(0, 50),
        confidence: typeof obj.confidence === "number"
          ? clamp(obj.confidence, 0, 1)
          : null,
        normalizedBox: box,
        source: "auto_detected",
      });
    }

    candidates.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));

    console.log(
      `[frame-options] Detected ${candidates.length} candidates`,
      candidates.map((c) => c.label),
    );

    return { candidates };
  } catch (err: any) {
    console.error("[frame-options] Detection failed:", err?.message);
    return { candidates: [], error: err?.message || "Detection failed" };
  }
}

// ─── Save selected frame options ─────────────────────────────────────────────

export async function saveFrameOptions(payload: {
  clipNodeId: string;
  frameTimestampMs: number;
  options: Array<{
    id?: string;
    label: string;
    shortLabel?: string | null;
    objectType?: string | null;
    source: "auto_detected" | "manual";
    confidence?: number | null;
    normalizedBox: NormalizedBox;
    isSelected: boolean;
  }>;
}): Promise<{ error?: string }> {
  try {
    const parsed = saveFrameOptionsPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return { error: parsed.error.issues.map((i) => i.message).join("; ") };
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not signed in" };

    const serviceClient = await createServiceClient();

    const { data: clip } = await serviceClient
      .from("clip_nodes")
      .select("creator_user_id")
      .eq("id", payload.clipNodeId)
      .single();

    if (!clip || clip.creator_user_id !== user.id) {
      return { error: "Not authorized" };
    }

    const selected = payload.options.filter((o) => o.isSelected);
    if (selected.length < 2) return { error: "Select at least 2 options" };
    if (selected.length > 4) return { error: "Maximum 4 options" };

    await serviceClient
      .from("video_frame_options")
      .delete()
      .eq("clip_node_id", payload.clipNodeId);

    const rows = payload.options.map((opt, i) => ({
      clip_node_id: payload.clipNodeId,
      frame_timestamp_ms: payload.frameTimestampMs,
      source: opt.source,
      label: opt.label,
      short_label: opt.shortLabel || null,
      object_type: opt.objectType || null,
      confidence: opt.confidence ?? null,
      is_selected: opt.isSelected,
      box_x: opt.normalizedBox.x,
      box_y: opt.normalizedBox.y,
      box_width: opt.normalizedBox.width,
      box_height: opt.normalizedBox.height,
      z_index: i,
    }));

    const { error: insertErr } = await serviceClient
      .from("video_frame_options")
      .insert(rows);

    if (insertErr) return { error: insertErr.message };

    console.log(
      `[frame-options] Saved ${rows.length} options (${selected.length} selected) for clip ${payload.clipNodeId}`,
    );

    return {};
  } catch (err: any) {
    return { error: err?.message || "Save failed" };
  }
}

// ─── Read frame options for a clip ───────────────────────────────────────────

export async function getFrameOptions(clipNodeId: string): Promise<{
  options: (FrameOptionCandidate & { isSelected: boolean; id: string })[];
  frameTimestampMs: number;
  error?: string;
}> {
  try {
    const serviceClient = await createServiceClient();
    const { data, error } = await serviceClient
      .from("video_frame_options")
      .select("*")
      .eq("clip_node_id", clipNodeId)
      .order("z_index", { ascending: true });

    if (error) return { options: [], frameTimestampMs: 0, error: error.message };
    if (!data?.length) return { options: [], frameTimestampMs: 0 };

    const rows = data as FrameOptionRow[];
    const options = rows.map((row) => ({
      ...rowToCandidate(row),
      isSelected: row.is_selected,
      id: row.id,
    }));

    return {
      options,
      frameTimestampMs: rows[0]?.frame_timestamp_ms ?? 0,
    };
  } catch (err: any) {
    return { options: [], frameTimestampMs: 0, error: err?.message };
  }
}

// ─── Get only selected frame options (for betting UI) ────────────────────────

export async function getSelectedFrameOptions(clipNodeId: string): Promise<{
  options: Array<{
    id: string;
    label: string;
    shortLabel: string | null;
    normalizedBox: NormalizedBox;
  }>;
}> {
  try {
    const serviceClient = await createServiceClient();
    const { data } = await serviceClient
      .from("video_frame_options")
      .select("id, label, short_label, box_x, box_y, box_width, box_height")
      .eq("clip_node_id", clipNodeId)
      .eq("is_selected", true)
      .order("z_index", { ascending: true });

    if (!data?.length) return { options: [] };

    return {
      options: data.map((row: any) => ({
        id: row.id,
        label: row.label,
        shortLabel: row.short_label,
        normalizedBox: {
          x: row.box_x,
          y: row.box_y,
          width: row.box_width,
          height: row.box_height,
        },
      })),
    };
  } catch {
    return { options: [] };
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
