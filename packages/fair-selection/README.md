# @bettok/fair-selection

Provably fair, deterministic weighted selection using SHA-256.

Every selection can be independently verified by anyone — no server secrets, no hidden state.

## How it works

1. A **public seed** (e.g. clip ID + round number) is hashed with SHA-256.
2. The first 8 bytes of the hash are converted to a number in `[0, 1)`.
3. Candidate weights are normalized to sum to 1, forming a cumulative distribution.
4. The hash-derived number falls into exactly one bucket → that candidate is selected.

## Usage

```ts
import { selectOne, selectMultiple, verifyProof } from "@bettok/fair-selection";

// Single selection
const result = selectOne(
  [
    { id: "opt_1", label: "Pick up chips", weight: 0.4 },
    { id: "opt_2", label: "Grab a drink", weight: 0.35 },
    { id: "opt_3", label: "Walk to checkout", weight: 0.25 },
  ],
  { seed: "clip_abc123:round:0" }
);

console.log(result.selected.label); // e.g. "Pick up chips"
console.log(result.proof);          // full verifiable proof

// Anyone can verify
const isValid = verifyProof(result.proof, [0.4, 0.35, 0.25]);
console.log(isValid); // true
```

## Multi-selection with conflict tags

```ts
const result = selectMultiple(
  [
    { id: "opt_1", label: "Turn left",  weight: 0.5, conflictTags: ["direction"] },
    { id: "opt_2", label: "Turn right", weight: 0.3, conflictTags: ["direction"] },
    { id: "opt_3", label: "Pick up item", weight: 0.6 },
  ],
  { seed: "clip_abc123:round:0", maxSelections: 2 }
);

// Will select 2 candidates, but never both "turn left" and "turn right"
// because they share the "direction" conflict tag.
```

## Verification

The `proof` object contains everything needed to reproduce the selection:

- `seed` — the input string
- `hash` — SHA-256 hex digest
- `roll` — the derived random number
- `normalizedWeights` — weight distribution used
- `cumulativeDistribution` — the CDF
- `selectedIndex` — which bucket the roll landed in

Call `verifyProof(proof, originalWeights)` to confirm.

## Algorithm: `sha256-weighted-v1`

```
hash   = SHA-256(seed)
uint64 = first 8 bytes of hash as big-endian
roll   = uint64 / 2^64           → [0, 1)
norm   = weights / sum(weights)  → sums to 1
cdf[i] = sum(norm[0..i])
index  = first i where roll < cdf[i]
```

Zero dependencies. Node.js `crypto` module only.
