const flags = {
  ENABLE_REAL_LLM: false,
  ENABLE_REAL_MEDIA_GEN: false,
  ENABLE_CONTINUATION_PIPELINE: true,
  ENABLE_SETTLEMENT: true,
  ENABLE_WEB_PUSH: false,
  ENABLE_MODERATION_AI: false,
  ENABLE_UPLOAD: true,
  ENABLE_TEXT_TO_VIDEO: false,
  ENABLE_CREATOR_REWARDS: false,
  ENABLE_SOCIAL_FEATURES: false,
} as const;

type FlagKey = keyof typeof flags;

export function isFeatureEnabled(flag: FlagKey): boolean {
  const envOverride = process.env[`FF_${flag}`];
  if (envOverride !== undefined) {
    return envOverride === "true" || envOverride === "1";
  }
  return flags[flag];
}

export { flags as DEFAULT_FLAGS };
