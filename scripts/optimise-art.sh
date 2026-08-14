#!/bin/bash
# ============================================================================
#  Turns the source paintings in art-src/*.jpg into web-sized assets.
#
#  Run after adding or replacing an original:
#      ./scripts/optimise-art.sh
#
#  Uses sips (built into macOS) and cwebp (brew install webp). No npm
#  dependency, because this runs a handful of times ever — not on every build.
#
#  Reads masters from   art-src/*.jpg   (NOT served — anything inside public/
#                                        is copied into dist/ whether it is
#                                        requested or not, and these are 11 MB)
#  Writes web assets to  public/art/
#
#  Outputs, per painting:
#    <name>-800.webp   phones
#    <name>-1600.webp  desktop and retina phones
#  Plus one shared og.jpg for link previews.
# ============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."
ART=art-src
OUT=public/art
mkdir -p "$OUT"

command -v cwebp >/dev/null || { echo "cwebp not found — brew install webp"; exit 1; }

echo "Encoding WebP…"
for src in "$ART"/*.jpg; do
  name=$(basename "$src" .jpg)

  for width in 800 1600; do
    tmp="/tmp/utkarsh-$name-$width.jpg"
    # -Z fits the LONGEST side, so use --resampleWidth to pin width and keep
    # the aspect ratio. Never upscale past the original.
    orig_w=$(sips -g pixelWidth "$src" | awk '/pixelWidth/{print $2}')
    target=$(( width < orig_w ? width : orig_w ))

    sips --resampleWidth "$target" "$src" --out "$tmp" >/dev/null 2>&1
    # q=82 is the point where these painterly gradients stop showing banding.
    cwebp -q 82 -m 6 -quiet "$tmp" -o "$OUT/$name-$width.webp"
    rm -f "$tmp"
    printf '  %-22s %s\n' "$name-$width.webp" "$(du -h "$OUT/$name-$width.webp" | cut -f1)"
  done
done

# ---------------------------------------------------------------------------
# Social preview. Deliberately JPEG, not WebP: WhatsApp and several other link
# unfurlers still render WebP previews unreliably, and this image exists purely
# to look right when someone pastes the link into a school group.
# 1200x630 is the size Open Graph consumers expect.
# ---------------------------------------------------------------------------
echo "Building og.jpg…"
OG_SRC=$ART/running.jpg
sips --resampleWidth 1200 "$OG_SRC" --out /tmp/utkarsh-og.jpg >/dev/null 2>&1
sips -c 630 1200 /tmp/utkarsh-og.jpg --out "$OUT/og.jpg" >/dev/null 2>&1
sips -s format jpeg -s formatOptions 72 "$OUT/og.jpg" --out "$OUT/og.jpg" >/dev/null 2>&1
rm -f /tmp/utkarsh-og.jpg
printf '  %-22s %s\n' "og.jpg" "$(du -h "$OUT/og.jpg" | cut -f1)"

echo
echo "Served assets:"
du -ch "$OUT"/*.webp "$OUT"/og.jpg | tail -1
