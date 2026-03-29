#!/usr/bin/env bash
# Upload Pexels pattern PNGs into Supabase Storage `media` bucket paths used by image_patterns.
# Requires Supabase CLI v2 with experimental storage. Bucket `media` must exist (migration 00002).
# Usage:
#   ./scripts/upload-image-patterns.sh              # local
#   ./scripts/upload-image-patterns.sh --linked       # linked hosted project
# Re-run safely: removes existing objects at the same paths first (see loop below) or delete in Dashboard.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ASSETS="${CURSOR_ASSETS_DIR:-$HOME/.cursor/projects/Users-markodjordjevic-projects-creators/assets}"
if [[ ! -d "$ASSETS" ]]; then
  echo "Assets dir not found: $ASSETS"
  echo "Set CURSOR_ASSETS_DIR to the folder with the 8 pexels PNGs."
  exit 1
fi

LOCAL=(--local)
if [[ "${1:-}" == "--linked" ]]; then
  LOCAL=(--linked)
fi

cp_one() {
  local file="$1"
  local dest="$2"
  if [[ ! -f "$file" ]]; then
    echo "Missing: $file"
    exit 1
  fi
  echo "Uploading $(basename "$file") -> ss:///media/$dest"
  supabase storage cp --experimental "${LOCAL[@]}" "$file" "ss:///media/$dest"
}

cd "$ROOT"

PATTERN_FILES=(
  patterns/lion_grass.png
  patterns/vending_machine.png
  patterns/beetle_red_light.png
  patterns/woman_two_outfits.png
  patterns/solo_shopper_aisle.png
  patterns/couple_grocery.png
  patterns/golf_putt.png
  patterns/fluffy_kitten.png
)
for p in "${PATTERN_FILES[@]}"; do
  supabase storage rm --experimental "${LOCAL[@]}" --yes "ss:///media/$p" 2>/dev/null || true
done

# Order matches image_patterns (00011 + 00013 fluffy_kitten)
cp_one "$ASSETS/pexels-nicolette-villavicencio-1114434-5940292-a1f1d561-65dc-4bbd-93c8-a0da8d0cb9ce.png" "patterns/lion_grass.png"
cp_one "$ASSETS/pexels-clement-proust-363898785-36286372-6cb14cc7-cff0-4ea4-9523-7e4b26118864.png" "patterns/vending_machine.png"
cp_one "$ASSETS/pexels-gyulay-redzheb-48864562-7582246-83341ad1-fb04-43ae-b8a5-130236fac5ac.png" "patterns/beetle_red_light.png"
cp_one "$ASSETS/pexels-cottonbro-4046317-52fa723d-8d03-467e-be18-95240544148b.png" "patterns/woman_two_outfits.png"
cp_one "$ASSETS/pexels-andrea-bova-1169228-6488889-9eb611ab-3d83-4d9d-b8ba-8a1055ca08f3.png" "patterns/solo_shopper_aisle.png"
cp_one "$ASSETS/pexels-jack-sparrow-4199289-954f2963-856b-4f9d-8ae5-c8d5788d15c2.png" "patterns/couple_grocery.png"
cp_one "$ASSETS/pexels-jopwell-1325661-401ac377-477e-408f-beef-11c35f263715.png" "patterns/golf_putt.png"
cp_one "$ASSETS/pexels-momixzaa-4723579-4e6063ca-a0ba-4866-aa36-5a12df03d78a.png" "patterns/fluffy_kitten.png"
echo "Done."
