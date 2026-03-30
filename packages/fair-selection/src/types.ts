/**
 * @bettok/fair-selection — Types
 *
 * All types are plain objects with no external dependencies,
 * so any consumer can inspect and serialize them.
 */

/** A single candidate for selection. */
export interface SelectionCandidate {
  /** Unique identifier for this candidate. */
  id: string;
  /** Human-readable label. */
  label: string;
  /** Weight / probability score (0–1). Higher = more likely to be selected. */
  weight: number;
  /** Optional conflict tags. Two candidates sharing a tag cannot be co-selected. */
  conflictTags?: string[];
  /** Arbitrary metadata passed through unchanged. */
  metadata?: Record<string, unknown>;
}

/** The publicly verifiable proof of a selection. */
export interface SelectionProof {
  /** The algorithm used. Always "sha256-weighted-v1" for this version. */
  algorithm: "sha256-weighted-v1";
  /** The public seed used (anyone can see this). */
  seed: string;
  /** SHA-256 hex digest of the seed. */
  hash: string;
  /** The decimal value derived from the first 8 bytes of the hash (0–1). */
  roll: number;
  /** The normalized weights used (sum = 1). Order matches input candidates. */
  normalizedWeights: number[];
  /** The cumulative distribution used for selection. */
  cumulativeDistribution: number[];
  /** Index of the selected candidate in the input array. */
  selectedIndex: number;
  /** Timestamp of the selection (ISO 8601). */
  timestamp: string;
}

/** Result of a single selection. */
export interface SelectionResult {
  /** The selected candidate. */
  selected: SelectionCandidate;
  /** The full proof — enough for anyone to verify the selection. */
  proof: SelectionProof;
}

/** Result of multi-selection (1+ candidates). */
export interface MultiSelectionResult {
  /** Ordered list of selected candidates. */
  selected: SelectionCandidate[];
  /** One proof per selection round. */
  proofs: SelectionProof[];
  /** Candidates that were excluded due to conflicts. */
  excludedByConflict: SelectionCandidate[];
}

/** Options for the selection function. */
export interface SelectionOptions {
  /**
   * Public seed string. This is hashed with SHA-256 to produce the random roll.
   * For provable fairness, this should be committed before candidates are known,
   * or derived from a public source (e.g., clip ID + block hash + round number).
   */
  seed: string;
  /** Minimum weight threshold — candidates below this are excluded. Default: 0. */
  minWeight?: number;
}

/** Options for multi-selection. */
export interface MultiSelectionOptions extends SelectionOptions {
  /** Maximum number of candidates to select. Default: 1. */
  maxSelections?: number;
  /** If true, respect conflictTags and skip conflicting candidates. Default: true. */
  respectConflicts?: boolean;
}
