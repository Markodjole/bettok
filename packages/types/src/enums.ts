export const ClipNodeStatus = {
  DRAFT: "draft",
  PROCESSING: "processing",
  READY_FOR_BETTING: "ready_for_betting",
  BETTING_OPEN: "betting_open",
  BETTING_LOCKED: "betting_locked",
  CONTINUATION_GENERATING: "continuation_generating",
  CONTINUATION_READY: "continuation_ready",
  SETTLED: "settled",
  ARCHIVED: "archived",
  FAILED: "failed",
} as const;

export type ClipNodeStatus =
  (typeof ClipNodeStatus)[keyof typeof ClipNodeStatus];

export const ClipSourceType = {
  UPLOAD: "upload",
  TEXT_TO_VIDEO: "text_to_video",
  IMAGE_TO_VIDEO: "image_to_video",
  CONTINUATION: "continuation",
} as const;

export type ClipSourceType =
  (typeof ClipSourceType)[keyof typeof ClipSourceType];

export const BetStatus = {
  PENDING_HOLD: "pending_hold",
  ACTIVE: "active",
  LOCKED: "locked",
  SETTLED_WIN: "settled_win",
  SETTLED_LOSS: "settled_loss",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export type BetStatus = (typeof BetStatus)[keyof typeof BetStatus];

export const PredictionStatus = {
  RAW_SUBMITTED: "raw_submitted",
  NORMALIZED: "normalized",
  OPEN: "open",
  LOCKED: "locked",
  SETTLED: "settled",
  REJECTED_MODERATION: "rejected_moderation",
  REJECTED_NORMALIZATION: "rejected_normalization",
} as const;

export type PredictionStatus =
  (typeof PredictionStatus)[keyof typeof PredictionStatus];

export const ContinuationJobStatus = {
  QUEUED: "queued",
  RUNNING: "running",
  GENERATED_TEXT: "generated_text",
  GENERATED_MEDIA: "generated_media",
  VALIDATED: "validated",
  FAILED: "failed",
  PUBLISHED: "published",
} as const;

export type ContinuationJobStatus =
  (typeof ContinuationJobStatus)[keyof typeof ContinuationJobStatus];

export const WalletTransactionType = {
  DEPOSIT_DEMO: "deposit_demo",
  WITHDRAWAL_DEMO: "withdrawal_demo",
  BET_HOLD: "bet_hold",
  BET_RELEASE: "bet_release",
  BET_WIN: "bet_win",
  BET_LOSS: "bet_loss",
  ADMIN_ADJUSTMENT: "admin_adjustment",
  REFERRAL_BONUS: "referral_bonus",
  CREATOR_REWARD: "creator_reward",
} as const;

export type WalletTransactionType =
  (typeof WalletTransactionType)[keyof typeof WalletTransactionType];

export const MarketSideKey = {
  YES: "yes",
  NO: "no",
} as const;

export type MarketSideKey =
  (typeof MarketSideKey)[keyof typeof MarketSideKey];

export const NotificationType = {
  BET_LOCKED: "bet_locked",
  PREDICTION_ACCEPTED: "prediction_accepted",
  CONTINUATION_LIVE: "continuation_live",
  BET_SETTLED: "bet_settled",
  BET_WON: "bet_won",
  BET_LOST: "bet_lost",
  PARTIALLY_CORRECT: "partially_correct",
  CLIP_FIRST_BETS: "clip_first_bets",
  MODERATION_ACTION: "moderation_action",
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export const UserRole = {
  VIEWER: "viewer",
  CREATOR: "creator",
  MODERATOR: "moderator",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const Genre = {
  ACTION: "action",
  COMEDY: "comedy",
  DRAMA: "drama",
  HORROR: "horror",
  ROMANCE: "romance",
  SCIFI: "sci_fi",
  THRILLER: "thriller",
  FANTASY: "fantasy",
  MYSTERY: "mystery",
  SLICE_OF_LIFE: "slice_of_life",
  NATURE: "nature",
  SPORTS: "sports",
} as const;

export type Genre = (typeof Genre)[keyof typeof Genre];

export const Tone = {
  SERIOUS: "serious",
  HUMOROUS: "humorous",
  DARK: "dark",
  LIGHTHEARTED: "lighthearted",
  TENSE: "tense",
  WHOLESOME: "wholesome",
  CHAOTIC: "chaotic",
} as const;

export type Tone = (typeof Tone)[keyof typeof Tone];

export const RealismLevel = {
  REALISTIC: "realistic",
  STYLIZED: "stylized",
  ANIMATED: "animated",
  ABSTRACT: "abstract",
  SURREAL: "surreal",
} as const;

export type RealismLevel =
  (typeof RealismLevel)[keyof typeof RealismLevel];
