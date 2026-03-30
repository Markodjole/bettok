/**
 * @bettok/fair-selection — Core selection logic
 *
 * Provably fair weighted selection using SHA-256.
 *
 * How it works:
 * 1. A public seed is hashed with SHA-256 → 32-byte digest.
 * 2. The first 8 bytes of the digest are read as a big-endian uint64.
 * 3. That uint64 is divided by 2^64 to produce a decimal roll in [0, 1).
 * 4. Candidate weights are normalized to sum to 1.
 * 5. A cumulative distribution is built from the normalized weights.
 * 6. The roll falls into exactly one bucket → that candidate is selected.
 *
 * Anyone with the seed can recompute the hash and verify the selection.
 * No server secret is involved — the algorithm is fully deterministic and open.
 */

import { createHash } from "crypto";
import type {
  SelectionCandidate,
  SelectionOptions,
  SelectionProof,
  SelectionResult,
  MultiSelectionOptions,
  MultiSelectionResult,
} from "./types";

const ALGORITHM_VERSION = "sha256-weighted-v1" as const;
const MAX_UINT64 = BigInt("18446744073709551616"); // 2^64

/**
 * Compute SHA-256 hex digest of a string.
 */
export function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Derive a deterministic roll in [0, 1) from a hex hash.
 * Uses the first 16 hex chars (8 bytes) as a big-endian uint64.
 */
export function hashToRoll(hexHash: string): number {
  const first16 = hexHash.slice(0, 16);
  const value = BigInt(`0x${first16}`);
  return Number((value * BigInt(1_000_000_000_000)) / MAX_UINT64) / 1_000_000_000_000;
}

/**
 * Normalize an array of weights so they sum to 1.
 * Weights <= 0 are treated as 0.
 */
export function normalizeWeights(weights: number[]): number[] {
  const clamped = weights.map((w) => Math.max(0, w));
  const sum = clamped.reduce((a, b) => a + b, 0);
  if (sum === 0) return clamped.map(() => 1 / clamped.length);
  return clamped.map((w) => w / sum);
}

/**
 * Build cumulative distribution from normalized weights.
 * Result[i] = sum of normalizedWeights[0..i].
 */
export function buildCumulativeDistribution(normalizedWeights: number[]): number[] {
  const cdf: number[] = [];
  let acc = 0;
  for (const w of normalizedWeights) {
    acc += w;
    cdf.push(acc);
  }
  if (cdf.length > 0) cdf[cdf.length - 1] = 1;
  return cdf;
}

/**
 * Given a roll and a CDF, return the index of the selected bucket.
 */
export function rollToIndex(roll: number, cdf: number[]): number {
  for (let i = 0; i < cdf.length; i++) {
    if (roll < cdf[i]) return i;
  }
  return cdf.length - 1;
}

/**
 * Select one candidate from a weighted list using a public seed.
 *
 * @throws {Error} if candidates array is empty
 */
export function selectOne(
  candidates: SelectionCandidate[],
  options: SelectionOptions,
): SelectionResult {
  const { seed, minWeight = 0 } = options;

  const eligible = candidates.filter((c) => c.weight >= minWeight);
  if (eligible.length === 0) {
    throw new Error("No eligible candidates (all below minWeight or empty array)");
  }

  const hash = sha256(seed);
  const roll = hashToRoll(hash);
  const weights = eligible.map((c) => c.weight);
  const normalized = normalizeWeights(weights);
  const cdf = buildCumulativeDistribution(normalized);
  const selectedIndex = rollToIndex(roll, cdf);

  const proof: SelectionProof = {
    algorithm: ALGORITHM_VERSION,
    seed,
    hash,
    roll,
    normalizedWeights: normalized,
    cumulativeDistribution: cdf,
    selectedIndex,
    timestamp: new Date().toISOString(),
  };

  return {
    selected: eligible[selectedIndex],
    proof,
  };
}

/**
 * Select multiple non-conflicting candidates.
 *
 * Each round:
 * 1. Hash the seed (round N uses `${seed}:round:${N}`)
 * 2. Select from remaining eligible candidates
 * 3. Remove the selected candidate + any candidates that share a conflictTag
 * 4. Repeat until maxSelections reached or no candidates remain
 */
export function selectMultiple(
  candidates: SelectionCandidate[],
  options: MultiSelectionOptions,
): MultiSelectionResult {
  const { seed, minWeight = 0, maxSelections = 1, respectConflicts = true } = options;

  let pool = candidates.filter((c) => c.weight >= minWeight);
  if (pool.length === 0) {
    throw new Error("No eligible candidates (all below minWeight or empty array)");
  }

  const selected: SelectionCandidate[] = [];
  const proofs: SelectionProof[] = [];
  const excludedByConflict: SelectionCandidate[] = [];
  const usedConflictTags = new Set<string>();

  for (let round = 0; round < maxSelections && pool.length > 0; round++) {
    const roundSeed = `${seed}:round:${round}`;
    const result = selectOne(pool, { seed: roundSeed, minWeight: 0 });
    selected.push(result.selected);
    proofs.push(result.proof);

    if (respectConflicts && result.selected.conflictTags?.length) {
      for (const tag of result.selected.conflictTags) {
        usedConflictTags.add(tag);
      }
    }

    pool = pool.filter((c) => {
      if (c.id === result.selected.id) return false;
      if (respectConflicts && c.conflictTags?.some((t) => usedConflictTags.has(t))) {
        excludedByConflict.push(c);
        return false;
      }
      return true;
    });
  }

  return { selected, proofs, excludedByConflict };
}

/**
 * Verify a selection proof.
 * Returns true if recomputing from the seed produces the same result.
 * This is the function anyone can call to audit a selection.
 */
export function verifyProof(
  proof: SelectionProof,
  candidateWeights: number[],
): boolean {
  if (proof.algorithm !== ALGORITHM_VERSION) return false;

  const recomputedHash = sha256(proof.seed);
  if (recomputedHash !== proof.hash) return false;

  const recomputedRoll = hashToRoll(recomputedHash);
  if (Math.abs(recomputedRoll - proof.roll) > 1e-12) return false;

  const normalized = normalizeWeights(candidateWeights);
  const cdf = buildCumulativeDistribution(normalized);
  const recomputedIndex = rollToIndex(recomputedRoll, cdf);
  if (recomputedIndex !== proof.selectedIndex) return false;

  return true;
}

/**
 * Build a human-readable verification summary for transparency.
 */
export function buildVerificationSummary(
  result: SelectionResult,
  allCandidates: SelectionCandidate[],
): string {
  const { proof, selected } = result;
  const lines = [
    `=== Fair Selection Verification ===`,
    `Algorithm: ${proof.algorithm}`,
    `Seed: ${proof.seed}`,
    `SHA-256: ${proof.hash}`,
    `Roll: ${proof.roll.toFixed(12)}`,
    ``,
    `Candidates (${allCandidates.length}):`,
    ...allCandidates.map((c, i) => {
      const mark = c.id === selected.id ? " ← SELECTED" : "";
      return `  [${i}] ${c.label} (weight: ${c.weight}, normalized: ${proof.normalizedWeights[i]?.toFixed(6)})${mark}`;
    }),
    ``,
    `CDF: [${proof.cumulativeDistribution.map((v) => v.toFixed(6)).join(", ")}]`,
    `Selected index: ${proof.selectedIndex}`,
    `Selected: "${selected.label}" (${selected.id})`,
    `Timestamp: ${proof.timestamp}`,
    ``,
    `To verify: sha256("${proof.seed}") → first 8 bytes → roll ${proof.roll.toFixed(12)} → index ${proof.selectedIndex}`,
  ];
  return lines.join("\n");
}
