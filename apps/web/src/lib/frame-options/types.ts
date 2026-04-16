import { z } from "zod";

export const normalizedBoxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().gt(0).max(1),
  height: z.number().gt(0).max(1),
});

export type NormalizedBox = z.infer<typeof normalizedBoxSchema>;

export const frameOptionCandidateSchema = z.object({
  tempId: z.string(),
  label: z.string().min(1).max(80),
  shortLabel: z.string().max(32).nullable().optional(),
  objectType: z.string().max(50).nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  normalizedBox: normalizedBoxSchema,
  source: z.enum(["auto_detected", "manual"]),
});

export type FrameOptionCandidate = z.infer<typeof frameOptionCandidateSchema>;

export const saveFrameOptionsPayloadSchema = z.object({
  clipNodeId: z.string().min(1),
  frameTimestampMs: z.number().min(0),
  options: z
    .array(
      z.object({
        id: z.string().optional(),
        label: z.string().min(1).max(80),
        shortLabel: z.string().max(32).nullable().optional(),
        objectType: z.string().max(50).nullable().optional(),
        source: z.enum(["auto_detected", "manual"]),
        confidence: z.number().min(0).max(1).nullable().optional(),
        normalizedBox: normalizedBoxSchema,
        isSelected: z.boolean(),
      }),
    )
    .min(1)
    .max(20),
});

export type SaveFrameOptionsPayload = z.infer<typeof saveFrameOptionsPayloadSchema>;

export interface FrameOptionRow {
  id: string;
  clip_node_id: string;
  frame_timestamp_ms: number;
  source: "auto_detected" | "manual";
  label: string;
  short_label: string | null;
  object_type: string | null;
  confidence: number | null;
  is_selected: boolean;
  box_x: number;
  box_y: number;
  box_width: number;
  box_height: number;
  z_index: number | null;
  prediction_market_id: string | null;
  created_at: string;
  updated_at: string;
}

export function rowToCandidate(row: FrameOptionRow): FrameOptionCandidate {
  return {
    tempId: row.id,
    label: row.label,
    shortLabel: row.short_label,
    objectType: row.object_type,
    confidence: row.confidence,
    normalizedBox: {
      x: row.box_x,
      y: row.box_y,
      width: row.box_width,
      height: row.box_height,
    },
    source: row.source as "auto_detected" | "manual",
  };
}

export function toNormalizedBox(
  box: { x: number; y: number; width: number; height: number },
  imageWidth: number,
  imageHeight: number,
): NormalizedBox {
  return {
    x: box.x / imageWidth,
    y: box.y / imageHeight,
    width: box.width / imageWidth,
    height: box.height / imageHeight,
  };
}

export function validateSelectedOptions(
  options: FrameOptionCandidate[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const selected = options.filter(
    (o) => "isSelected" in o ? (o as any).isSelected : true,
  );

  if (selected.length < 2) errors.push("Select at least 2 options");
  if (selected.length > 4) errors.push("Maximum 4 options allowed");

  const labels = selected.map((o) => o.label.toLowerCase().trim());
  const uniqueLabels = new Set(labels);
  if (uniqueLabels.size < labels.length) {
    errors.push("Option labels must be unique");
  }

  for (let i = 0; i < selected.length; i++) {
    for (let j = i + 1; j < selected.length; j++) {
      const a = selected[i].normalizedBox;
      const b = selected[j].normalizedBox;
      const overlapX = Math.max(
        0,
        Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x),
      );
      const overlapY = Math.max(
        0,
        Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y),
      );
      const overlapArea = overlapX * overlapY;
      const aArea = a.width * a.height;
      const bArea = b.width * b.height;
      const minArea = Math.min(aArea, bArea);
      if (minArea > 0 && overlapArea / minArea > 0.7) {
        errors.push(
          `"${selected[i].label}" and "${selected[j].label}" overlap too much`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
