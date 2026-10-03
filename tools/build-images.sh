#!/usr/bin/env bash
# Generates WebP derivatives from _source/sets/<slug>/*.jpg into
# assets/img/sets/<slug>/<NN>-<width>.webp
#
# One width ladder for every photo, portrait or landscape. Three widths only:
#   400   grid cells and set cards at 1x
#   800   the same slots at 2x, and the about/lead figures at 1x
#   1600  the home hero and the lightbox
# Keep it at three. Adding near-duplicate widths (396 vs 400 vs 352) buys
# nothing and multiplies the files that have to ship.
#
# Usage: FFMPEG=/path/to/ffmpeg bash tools/build-images.sh

set -euo pipefail
cd "$(dirname "$0")/.."

FFMPEG="${FFMPEG:-ffmpeg}"
command -v "$FFMPEG" >/dev/null || { echo "ffmpeg not found; set FFMPEG=/path/to/ffmpeg" >&2; exit 1; }

WIDTHS="400 800 1600"
QUALITY=80

encoded=0

for dir in _source/sets/*/; do
  slug="$(basename "$dir")"
  outdir="assets/img/sets/$slug"
  mkdir -p "$outdir"

  for photo in "$dir"*.jpg; do
    [ -e "$photo" ] || continue
    base="$(basename "$photo" .jpg)"
    for w in $WIDTHS; do
      "$FFMPEG" -v error -y -i "$photo" \
        -vf "scale='min($w,iw)':-2:flags=lanczos" \
        -c:v libwebp -quality "$QUALITY" -compression_level 6 \
        -frames:v 1 "$outdir/${base}-${w}.webp"
      encoded=$((encoded+1))
    done
  done
  echo "  $slug -> $(ls "$outdir" | wc -l) files"
done

echo "done: $encoded encoded"
