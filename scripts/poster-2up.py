#!/usr/bin/env python3
"""
Place a poster twice on one A4 landscape sheet, so a single print can be cut
down the middle into two copies.

    python3 scripts/poster-2up.py poster.jpg out.pdf [--margin MM]

Why a hand-written PDF: the source JPEG is embedded verbatim with /DCTDecode.
Nothing is re-encoded, resampled or recompressed, so what prints is exactly the
artwork that went in. That is the whole point of the request, and it also means
no Pillow / ImageMagick / Ghostscript dependency.

Geometry
    A4 landscape is 297 x 210 mm, and A5 portrait is 148.5 x 210 mm, so two A5
    halves tile an A4 sheet exactly. A poster whose own proportions are not
    1:sqrt(2) cannot fill that half without being cropped or stretched, so it
    is scaled to FIT and centred. The leftover becomes white gutter — which is
    useful, because it is where the scissors go.
"""

import struct
import sys

MM = 72.0 / 25.4  # 1 mm in PostScript points

A4_LANDSCAPE = (297.0 * MM, 210.0 * MM)
HALF_W = A4_LANDSCAPE[0] / 2  # one A5 portrait width


def jpeg_info(data: bytes):
    """Width, height and component count, read from the JPEG's SOF marker."""
    if data[:2] != b"\xff\xd8":
        raise SystemExit("Not a JPEG (no SOI marker). This script embeds JPEG only.")

    i = 2
    while i < len(data):
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]
        i += 2
        # Standalone markers carry no length.
        if marker in (0xD8, 0xD9) or 0xD0 <= marker <= 0xD7:
            continue
        (seg_len,) = struct.unpack(">H", data[i : i + 2])
        # SOF0..SOF15, excluding the DHT/JPG/DAC markers interleaved in range.
        if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
                      0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
            h, w = struct.unpack(">HH", data[i + 3 : i + 7])
            components = data[i + 7]
            return w, h, components
        i += seg_len
    raise SystemExit("Could not find the JPEG size marker.")


def build_pdf(jpg: bytes, w_px: int, h_px: int, components: int, margin_mm: float) -> bytes:
    page_w, page_h = A4_LANDSCAPE

    # Largest rectangle with the poster's own proportions that fits in one half,
    # inset by the safety margin.
    avail_w = HALF_W - 2 * margin_mm * MM
    avail_h = page_h - 2 * margin_mm * MM
    scale = min(avail_w / w_px, avail_h / h_px)
    draw_w, draw_h = w_px * scale, h_px * scale

    y = (page_h - draw_h) / 2
    x_left = (HALF_W - draw_w) / 2
    x_right = HALF_W + (HALF_W - draw_w) / 2

    colorspace = {1: "/DeviceGray", 3: "/DeviceRGB", 4: "/DeviceCMYK"}.get(components)
    if colorspace is None:
        raise SystemExit(f"Unsupported JPEG with {components} components.")

    # A hairline down the exact centre, to cut along. It sits in the gutter, so
    # it never touches the artwork.
    content = (
        f"q {draw_w:.4f} 0 0 {draw_h:.4f} {x_left:.4f} {y:.4f} cm /Im0 Do Q\n"
        f"q {draw_w:.4f} 0 0 {draw_h:.4f} {x_right:.4f} {y:.4f} cm /Im0 Do Q\n"
        f"0.75 0.75 0.75 RG 0.4 w [3 3] 0 d\n"
        f"{HALF_W:.4f} 0 m {HALF_W:.4f} {page_h:.4f} l S\n"
    ).encode("ascii")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {page_w:.4f} {page_h:.4f}] "
            f"/Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>"
        ).encode("ascii"),
        b"<< /Length " + str(len(content)).encode() + b" >>\nstream\n" + content + b"endstream",
        (
            f"<< /Type /XObject /Subtype /Image /Width {w_px} /Height {h_px} "
            f"/ColorSpace {colorspace} /BitsPerComponent 8 /Filter /DCTDecode "
            f"/Length {len(jpg)} >>"
        ).encode("ascii") + b"\nstream\n" + jpg + b"\nendstream",
    ]

    out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = []
    for n, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{n} 0 obj\n".encode() + body + b"\nendobj\n"

    xref_at = len(out)
    out += f"xref\n0 {len(objects) + 1}\n".encode()
    out += b"0000000000 65535 f \n"
    for off in offsets:
        out += f"{off:010d} 00000 n \n".encode()
    out += (
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref_at}\n%%EOF\n"
    ).encode()

    return bytes(out), draw_w / MM, draw_h / MM


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    margin = 0.0
    for a in sys.argv[1:]:
        if a.startswith("--margin"):
            margin = float(a.split("=", 1)[1]) if "=" in a else 0.0

    if len(args) < 2:
        raise SystemExit(__doc__.strip())

    src, dst = args[0], args[1]
    jpg = open(src, "rb").read()
    w, h, comps = jpeg_info(jpg)
    pdf, mm_w, mm_h = build_pdf(jpg, w, h, comps, margin)
    open(dst, "wb").write(pdf)

    print(f"{dst}")
    print(f"  source     {w} x {h} px, {comps} channels, embedded unchanged")
    print(f"  each copy  {mm_w:.1f} x {mm_h:.1f} mm   (A5 is 148.5 x 210)")
    print(f"  gutter     {(HALF_W / MM - mm_w):.1f} mm between the two, cut line down the centre")
    print(f"  page       A4 landscape, 297 x 210 mm")


if __name__ == "__main__":
    main()
