import { z } from "zod";

// ─── Analysis job statuses ──────────────────────────────────────────────────

export const VideoAnalysisStatus = {
  QUEUED: "queued",
  SAMPLING_FRAMES: "sampling_frames",
  EXTRACTING_VISION: "extracting_vision",
  EXTRACTING_TEMPORAL: "extracting_temporal",
  DERIVING_FEATURES: "deriving_features",
  STORED: "stored",
  FAILED: "failed",
} as const;

export type VideoAnalysisStatus =
  (typeof VideoAnalysisStatus)[keyof typeof VideoAnalysisStatus];

// ─── Confidence tiers ───────────────────────────────────────────────────────

export const EvidenceTier = {
  OBSERVED: "observed",
  INFERRED: "inferred",
  DERIVED: "derived",
} as const;

export type EvidenceTier =
  (typeof EvidenceTier)[keyof typeof EvidenceTier];

// ─── Frame sampling ─────────────────────────────────────────────────────────

export const sampledFrameSchema = z.object({
  frameIndex: z.number().int(),
  timestampMs: z.number(),
  base64: z.string(),
});

export type SampledFrame = z.infer<typeof sampledFrameSchema>;

// ─── Characters ─────────────────────────────────────────────────────────────

export const characterSchema = z.object({
  characterId: z.string(),
  label: z.string(),
  ageGroup: z.enum(["child", "teen", "young_adult", "adult", "older_adult", "unknown"]).optional(),
  genderPresentation: z.enum(["male_presenting", "female_presenting", "androgynous", "unknown"]).optional(),
  bodyBuild: z.enum(["slim", "average", "heavyset", "muscular", "unknown"]).optional(),
  hairDescription: z.string().optional(),
  clothingTop: z.string().optional(),
  clothingBottom: z.string().optional(),
  accessories: z.array(z.string()).optional(),
  dominantEmotion: z.string().optional(),
  gazeDirection: z.string().optional(),
  posture: z.string().optional(),
  locationInFrame: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type Character = z.infer<typeof characterSchema>;

// ─── Objects ────────────────────────────────────────────────────────────────

export const objectEntitySchema = z.object({
  objectId: z.string(),
  label: z.string(),
  category: z.enum([
    "food", "drink", "machine", "vehicle", "weapon_like_prop",
    "sports_equipment", "furniture", "screen", "money", "tool",
    "container", "clothing", "animal", "other",
  ]),
  brandOrTextVisible: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  sizeRelative: z.enum(["small", "medium", "large"]).optional(),
  state: z.string().optional(),
  locationInFrame: z.string().optional(),
  priceIfVisible: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type ObjectEntity = z.infer<typeof objectEntitySchema>;

// ─── Environment ────────────────────────────────────────────────────────────

export const environmentSchema = z.object({
  locationType: z.string().optional(),
  indoorOutdoor: z.enum(["indoor", "outdoor", "unknown"]).optional(),
  settingTags: z.array(z.string()),
  lighting: z.string().optional(),
  timeOfDay: z.string().optional(),
  weather: z.string().optional(),
  ambiance: z.array(z.string()).optional(),
  visibleText: z.array(z.string()).optional(),
  priceRange: z.string().nullable().optional(),
  economicContext: z.string().nullable().optional(),
});

export type Environment = z.infer<typeof environmentSchema>;

// ─── Actions ────────────────────────────────────────────────────────────────

export const actionEventSchema = z.object({
  actionId: z.string(),
  actorId: z.string().optional(),
  targetObjectId: z.string().optional(),
  targetCharacterId: z.string().optional(),
  actionType: z.string(),
  actionPhase: z.enum(["start", "middle", "end", "completed"]).optional(),
  result: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type ActionEvent = z.infer<typeof actionEventSchema>;

// ─── Story beats ────────────────────────────────────────────────────────────

export const storyBeatSchema = z.object({
  beatIndex: z.number().int(),
  beatType: z.enum([
    "goal_setup", "attempt", "failure", "success", "reaction",
    "reveal", "choice", "confusion", "interruption", "completion",
    "anticipation", "tension",
  ]),
  summary: z.string(),
  involvedCharacterIds: z.array(z.string()),
  involvedObjectIds: z.array(z.string()),
});

export type StoryBeat = z.infer<typeof storyBeatSchema>;

// ─── Available options ──────────────────────────────────────────────────────

export const availableOptionSchema = z.object({
  optionId: z.string(),
  category: z.enum(["object_choice", "action_choice", "path_choice", "reaction_choice"]),
  label: z.string(),
  objectId: z.string().optional(),
  priceIfVisible: z.string().nullable().optional(),
  source: z.enum(["visible", "inferred_from_context"]),
  confidence: z.number().min(0).max(1).optional(),
});

export type AvailableOption = z.infer<typeof availableOptionSchema>;

// ─── Dialogue ───────────────────────────────────────────────────────────────

export const dialogueLineSchema = z.object({
  speakerCharacterId: z.string().optional(),
  text: z.string(),
  confidence: z.number().min(0).max(1).optional(),
});

export type DialogueLine = z.infer<typeof dialogueLineSchema>;

// ─── Visible text ───────────────────────────────────────────────────────────

export const visibleTextSchema = z.object({
  text: z.string(),
  locationDescription: z.string().optional(),
  type: z.enum(["brand", "menu", "screen_ui", "label", "sign", "price", "other"]).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type VisibleText = z.infer<typeof visibleTextSchema>;

// ─── Camera ─────────────────────────────────────────────────────────────────

export const cameraInfoSchema = z.object({
  shotType: z.enum(["wide", "medium", "closeup", "extreme_closeup", "insert", "unknown"]).optional(),
  cameraAngle: z.enum(["front", "side", "overhead", "three_quarter", "low_angle", "unknown"]).optional(),
  cameraMotion: z.enum(["static", "pan", "tilt", "zoom", "tracking", "handheld", "unknown"]).optional(),
});

export type CameraInfo = z.infer<typeof cameraInfoSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// LEVEL 1: Observed facts (directly from vision)
// ═══════════════════════════════════════════════════════════════════════════

export const observedFactsSchema = z.object({
  characters: z.array(characterSchema),
  objects: z.array(objectEntitySchema),
  environment: environmentSchema,
  actions: z.array(actionEventSchema),
  storyBeats: z.array(storyBeatSchema),
  availableOptions: z.array(availableOptionSchema),
  dialogueLines: z.array(dialogueLineSchema),
  visibleTexts: z.array(visibleTextSchema),
  camera: cameraInfoSchema,
});

export type ObservedFacts = z.infer<typeof observedFactsSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// LEVEL 2: Inferred soft signals
// ═══════════════════════════════════════════════════════════════════════════

export const characterIntentSchema = z.object({
  characterId: z.string(),
  primaryIntent: z.string().optional(),
  secondaryIntents: z.array(z.string()).optional(),
  evidence: z.array(z.string()),
  confidence: z.number().min(0).max(1).optional(),
});

export type CharacterIntent = z.infer<typeof characterIntentSchema>;

export const preferenceSignalSchema = z.object({
  characterId: z.string(),
  domain: z.enum(["drink", "food", "action_style", "risk", "brand", "social", "other"]),
  value: z.string(),
  basis: z.enum(["explicit_choice", "repeated_history", "dialogue", "visible_reaction", "gaze_duration"]),
  strength: z.number().min(0).max(1),
});

export type PreferenceSignal = z.infer<typeof preferenceSignalSchema>;

export const inferredSignalsSchema = z.object({
  characterIntents: z.array(characterIntentSchema),
  preferenceSignals: z.array(preferenceSignalSchema),
  mainStory: z.string(),
  currentStateSummary: z.string(),
  unresolvedQuestions: z.array(z.string()),
});

export type InferredSignals = z.infer<typeof inferredSignalsSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// LEVEL 3: Derived continuation features
// ═══════════════════════════════════════════════════════════════════════════

export const continuityAnchorSchema = z.object({
  characterAppearance: z.array(z.string()),
  wardrobe: z.array(z.string()),
  environment: z.array(z.string()),
  objectStates: z.array(z.string()),
  cameraStyle: z.array(z.string()),
});

export type ContinuityAnchor = z.infer<typeof continuityAnchorSchema>;

export const nextStepCandidateSchema = z.object({
  candidateId: z.string(),
  label: z.string(),
  rationale: z.string(),
  probabilityScore: z.number().min(0).max(1),
  basedOn: z.array(z.string()),
});

export type NextStepCandidate = z.infer<typeof nextStepCandidateSchema>;

export const derivedFeaturesSchema = z.object({
  continuityAnchors: continuityAnchorSchema,
  nextStepCandidates: z.array(nextStepCandidateSchema),
  spokenDialogue: z.string().nullable(),
});

export type DerivedFeatures = z.infer<typeof derivedFeaturesSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// Full analysis document
// ═══════════════════════════════════════════════════════════════════════════

export const extractionWarningSchema = z.object({
  type: z.string(),
  message: z.string(),
  severity: z.enum(["low", "medium", "high"]),
});

export type ExtractionWarning = z.infer<typeof extractionWarningSchema>;

export const extractionScoreSchema = z.object({
  entityConsistency: z.number().min(0).max(1),
  textReadability: z.number().min(0).max(1),
  actionClarity: z.number().min(0).max(1),
  storyClarity: z.number().min(0).max(1),
  continuationReadiness: z.number().min(0).max(1),
});

export type ExtractionScore = z.infer<typeof extractionScoreSchema>;

export const videoAnalysisSchema = z.object({
  version: z.literal(1),
  clipNodeId: z.string().uuid(),
  observed: observedFactsSchema,
  inferred: inferredSignalsSchema,
  derived: derivedFeaturesSchema,
  warnings: z.array(extractionWarningSchema),
  score: extractionScoreSchema,
  frameCount: z.number().int(),
  analysisModel: z.string(),
  analyzedAt: z.string(),
});

export type VideoAnalysis = z.infer<typeof videoAnalysisSchema>;

// ─── Continuation context (what the continuation engine reads) ──────────────

export const continuationContextSchema = z.object({
  clipNodeId: z.string(),
  mainStory: z.string(),
  currentStateSummary: z.string(),
  characters: z.array(characterSchema),
  objects: z.array(objectEntitySchema),
  environment: environmentSchema,
  continuityAnchors: continuityAnchorSchema,
  availableOptions: z.array(availableOptionSchema),
  preferenceSignals: z.array(preferenceSignalSchema),
  nextStepCandidates: z.array(nextStepCandidateSchema),
  unresolvedQuestions: z.array(z.string()),
  spokenDialogue: z.string().nullable(),
  score: extractionScoreSchema,
});

export type ContinuationContext = z.infer<typeof continuationContextSchema>;
