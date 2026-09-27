#!/usr/bin/env bash
# Generates WebP derivatives from _source/sets/<slug>/*.jpg into
# assets/img/sets/<slug>/<NN>-<width>.webp
# Usage: FFMPEG=/path/to/ffmpeg bash tools/build-images.sh

set -euo pipefail
cd "$(dirname "$0")/.."

FFMPEG="${FFMPEG:-ffmpeg}"
command -v "$FFMPEG" >/dev/null || { echo "ffmpeg not found; set FFMPEG=/path/to/ffmpeg" >&2; exit 1; }

LANDSCAPE_WIDTHS="352 528 704 1056 1760"
PORTRAIT_WIDTHS="264 396 528 792 1320"
PLACEHOLDER_WIDTH=32
QUALITY=82

CACHE_DIR=".cache/images"
mkdir -p "$CACHE_DIR"

encoded=0; reused=0; skipped=0

encode() {
  "$FFMPEG" -v error -y -i "$1" \
    -vf "scale=$3:-2:flags=lanczos" \
    -c:v libwebp -quality "$QUALITY" -compression_level 6 \
    -frames:v 1 "$2"
}

while IFS='|' read -r slug src orient; do
  [ -z "${slug:-}" ] && continue
  case "$orient" in
    portrait)  widths="$PORTRAIT_WIDTHS" ;;
    landscape) widths="$LANDSCAPE_WIDTHS" ;;
    *) echo "unknown orientation '$orient' for $slug" >&2; exit 1 ;;
  esac

  outdir="assets/img/sets/$slug"
  mkdir -p "$outdir"

  for photo in "_source/sets/$slug"/*.jpg; do
    [ -e "$photo" ] || continue
    base="$(basename "$photo" .jpg)"
    hash="$(md5sum "$photo" | cut -d' ' -f1)"

    for w in $widths $PLACEHOLDER_WIDTH; do
      dest="$outdir/${base}-${w}.webp"
      [ -f "$dest" ] && [ "$dest" -nt "$photo" ] && { skipped=$((skipped+1)); continue; }

      cached="$CACHE_DIR/${hash}-${w}.webp"
      if [ -f "$cached" ]; then
        cp "$cached" "$dest"; reused=$((reused+1))
      else
        encode "$photo" "$dest" "$w"
        cp "$dest" "$cached"; encoded=$((encoded+1))
      fi
    done
  done
  echo "  $slug ($orient) -> $(ls "$outdir" | wc -l) files"
done < tools/sets.map

echo "done: $encoded encoded, $reused reused, $skipped up to date"
