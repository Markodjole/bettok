/**
 * Supabase `media` bucket allows explicit MIME list (see migrations). Browsers often send
 * `image/jpg` (non-standard) or empty `type` for camera picks — normalize before upload.
 */
const IMAGE_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  jpe: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

const VIDEO_EXT: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  qt: "video/quicktime",
};

export function normalizeImageUploadContentType(file: File): string {
  const t = (file.type || "").toLowerCase().trim();
  if (t === "image/jpg" || t === "image/pjpeg" || t === "image/x-jpeg") return "image/jpeg";
  if (t === "image/jpeg" || t === "image/png" || t === "image/webp" || t === "image/heic" || t === "image/heif") {
    return t;
  }
  if (t.startsWith("image/")) return "image/jpeg"; // non-listed image/* → safe default for bucket allow-list
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXT[ext] ?? "image/jpeg";
}

export function normalizeVideoUploadContentType(file: File): string {
  const t = (file.type || "").toLowerCase().trim();
  if (t === "video/quicktime" || t === "video/mp4" || t === "video/webm") return t;
  if (t.startsWith("video/")) return "video/mp4";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return VIDEO_EXT[ext] ?? "video/mp4";
}

/** Accept picker when browser omits MIME (common on iOS) but extension is a known image. */
export function isLikelyImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ext in IMAGE_EXT;
}

export function isLikelyVideoFile(file: File): boolean {
  if (file.type.startsWith("video/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ext in VIDEO_EXT;
}
