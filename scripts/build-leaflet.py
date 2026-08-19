#!/usr/bin/env python3
"""
Builds the Gita Shloka Recitation leaflet: two A5 halves on one A4 landscape
sheet, cut down the middle.

Reads the verse list straight out of supabase/seed.sql rather than repeating
it, so the leaflet and the website cannot drift apart. Re-run after changing
the syllabus:

    python3 scripts/build-leaflet.py

Then open print/gita-shloka-leaflet.html and print A4 landscape, 100%, no
margins, background graphics ON.
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SEED = ROOT / "supabase" / "seed.sql"
OUT = ROOT / "print" / "gita-shloka-leaflet.html"

PHONE = "+91 93950 40843"
SITE = "utkarsh-festival.vercel.app"


def load_verses() -> dict:
    blocks = re.findall(r"\$syllabus\$(.*?)\$syllabus\$", SEED.read_text(), re.S)
    for b in blocks:
        d = json.loads(b)
        if d.get("kind") == "verses":
            return d
    raise SystemExit("No verse syllabus found in seed.sql")


def groups_html(data: dict) -> str:
    out = []
    for g in data["groups"]:
        chips = "".join(
            f'<span class="ref">{i["ref"]}</span>' for i in g["items"] if i.get("ref")
        )
        out.append(
            f"""      <div class="grp">
        <div class="grp-name">{g['label']}</div>
        <div class="refs">{chips}</div>
      </div>"""
        )
    return "\n".join(out)


def leaf(data: dict) -> str:
    return f"""  <section class="leaf">
    <div class="head">
      <div class="wordmark">UTKARSH<small>AN INTER SCHOOL CULTURAL EXTRAVAGANZA</small></div>
      <div class="edition">ISKCON Guwahati &middot; 2026</div>
    </div>

    <div class="title">
      <h1>Gita Shloka Recitation</h1>
      <p class="sanskrit-name">Shloka Uchcharana</p>
    </div>

    <div class="when">
      <span><b>Sunday, 23 August</b> &middot; 9 am to 12 noon</span>
      <span class="report">Report by 8 am</span>
      <span>ISKCON Guwahati, Ulubari</span>
    </div>

    <div class="lead">
      These are only suggestions &mdash; you may recite <u>any</u> verses from the
      Bhagavad-gita you already know.
    </div>

    <div class="section-label">Selected verses for reference</div>

{groups_html(data)}

    <div class="foot">
      <span>Full text of every verse: <b>{SITE}</b></span>
      <span>Register online or call <b>{PHONE}</b></span>
    </div>
  </section>"""


HTML = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Utkarsh 2026 — Gita Shloka Recitation (2 per A4)</title>
<style>
/* ===========================================================================
   Utkarsh 2026 — Gita Shloka Recitation leaflet.
   Two A5 leaflets on one A4 landscape sheet; cut down the centre.

   Print: A4, Landscape, Scale 100%, Margins None, tick "Background graphics".

   GENERATED FILE — edit scripts/build-leaflet.py, not this. The verse list is
   read from supabase/seed.sql so the leaflet and the website cannot disagree.
   =========================================================================== */

@page { size: A4 landscape; margin: 0; }

:root {
  --navy:   #1b3a9c;
  --pink:   #e5187f;
  --gold:   #ffd100;
  --ink:    #14204a;
  --rule:   #9aa3c4;
  --faint:  #eef1fa;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  width: 297mm;
  background: #fff;
  color: var(--ink);
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.sheet {
  width: 297mm;
  height: 210mm;
  display: flex;
  position: relative;
  overflow: hidden;
}

/* cut guide, dead centre */
.sheet::after {
  content: "";
  position: absolute;
  left: 148.5mm; top: 0; bottom: 0;
  border-left: 0.3mm dashed #b9c0d8;
}

.leaf {
  width: 148.5mm;
  height: 210mm;
  padding: 7mm 8mm;
  display: flex;
  flex-direction: column;
}

/* Nothing may shrink: the sheet height is fixed, and a squashed block would
   be clipped on paper without ever looking wrong on screen. */
.leaf > * { flex-shrink: 0; }

/* ------------------------------------------------------------------ head */
.head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  border-bottom: 0.6mm solid var(--navy);
  padding-bottom: 2mm;
}

.wordmark {
  font-size: 8mm;
  font-weight: 800;
  letter-spacing: 1.2mm;
  line-height: 1;
  color: var(--navy);
}

.wordmark small {
  display: block;
  font-size: 2mm;
  letter-spacing: 0.42mm;
  font-weight: 700;
  color: var(--pink);
  margin-top: 1.2mm;
}

.edition {
  font-size: 2.2mm;
  font-weight: 700;
  color: #6a7396;
  padding-bottom: 0.5mm;
}

/* ----------------------------------------------------------------- title */
.title { margin-top: 5mm; }

.title h1 {
  font-size: 7mm;
  font-weight: 800;
  letter-spacing: -0.1mm;
  line-height: 1.05;
  color: var(--ink);
}

.sanskrit-name {
  font-size: 3mm;
  font-style: italic;
  font-weight: 600;
  color: var(--pink);
  margin-top: 1mm;
}

/* ------------------------------------------------------------------ when */
.when {
  margin-top: 4mm;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.5mm 3mm;
  font-size: 2.5mm;
  color: #3d4770;
}

.when .report {
  background: var(--gold);
  color: var(--ink);
  font-weight: 800;
  padding: 0.7mm 2mm;
  border-radius: 1mm;
}

/* ------------------------------------------------------------------ lead */
.lead {
  margin-top: 4.5mm;
  border: 0.4mm solid var(--pink);
  background: #fff5fa;
  border-radius: 1.5mm;
  padding: 2.5mm 3mm;
  font-size: 2.7mm;
  font-weight: 700;
  line-height: 1.45;
  color: #8a1152;
}

.lead u { text-decoration: underline; text-underline-offset: 0.6mm; }

/* --------------------------------------------------------------- groups */
.section-label {
  margin-top: 6mm;
  margin-bottom: 4mm;
  font-size: 2.2mm;
  font-weight: 800;
  letter-spacing: 0.6mm;
  text-transform: uppercase;
  color: var(--navy);
  border-bottom: 0.3mm solid var(--rule);
  padding-bottom: 1mm;
}

.grp { margin-bottom: 5.5mm; }

.grp-name {
  font-size: 4.2mm;
  font-weight: 800;
  color: var(--ink);
  margin-bottom: 3mm;
}

.refs {
  display: flex;
  flex-wrap: wrap;
  gap: 2.2mm;
}

/* With the tags and the two lower blocks gone, the verse numbers ARE the
   leaflet — so they are set large enough to read at arm's length rather than
   sized to leave room for things that are no longer here. */
.ref {
  border: 0.4mm solid var(--navy);
  border-radius: 1.2mm;
  padding: 2mm 3.2mm;
  font-size: 3.6mm;
  font-weight: 700;
  color: var(--navy);
  background: var(--faint);
  white-space: nowrap;
}

/* ------------------------------------------------------------------ foot */
.foot {
  margin-top: auto;
  border-top: 0.3mm solid var(--rule);
  padding-top: 2mm;
  display: flex;
  flex-direction: column;
  gap: 0.8mm;
  font-size: 2.2mm;
  color: #5a638c;
}
</style>
</head>
<body>
<div class="sheet">
__LEAVES__
</div>
</body>
</html>
"""


def main() -> None:
    data = load_verses()
    one = leaf(data)
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(HTML.replace("__LEAVES__", one + "\n" + one))
    n = sum(len(g["items"]) for g in data["groups"])
    print(f"wrote {OUT.relative_to(ROOT)} — {n} verses across {len(data['groups'])} groups")


if __name__ == "__main__":
    main()
