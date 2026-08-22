#!/usr/bin/env python3
"""
Utkarsh 2026 — the judges' verse helper for Gita Shloka Recitation.

Two A4 pages carrying every verse we suggested on the site: the reference, the
transliteration the students actually learnt from, and a one-line meaning.
Younger bands on page one, older on page two, so two judges can hold one sheet
each rather than passing a booklet back and forth.

The verses come straight out of supabase/seed.sql, which is the same source the
website renders, so the sheet cannot drift from what the students were told to
learn.

    python3 scripts/build-verse-helper.py

Writes print/gita-verse-helper.html — open and print at A4, margins default.
"""

import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SEED = ROOT / 'supabase' / 'seed.sql'
OUT  = ROOT / 'print' / 'gita-verse-helper.html'


def load_verses():
    s = SEED.read_text()
    for block in re.findall(r'\$syllabus\$(.*?)\$syllabus\$', s, re.S):
        try:
            d = json.loads(block)
        except json.JSONDecodeError:
            continue
        if d.get('kind') == 'verses':
            return d
    sys.exit('No verse syllabus found in seed.sql')


def esc(t):
    return (t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))


# 16.1-3 is three verses carrying one long list of qualities; a single line of
# "meaning" under it flattens them rather than helping, so the sheet shows the
# Sanskrit alone and lets the judge listen to it as the chain it is.
NO_GIST = {'BG 16.1-3'}


def verse_html(v):
    lines = '<br>'.join(esc(l) for l in v['text'].split('\n'))
    note = f'<div class="note">{esc(v["note"])}</div>' if v.get('note') else ''
    gist = '' if v['ref'] in NO_GIST else f'<div class="gist">{esc(v["gist"])}</div>'
    return f"""
      <div class="verse">
        <div class="ref">{esc(v['ref'])}</div>
        <div class="sanskrit">{lines}</div>
        {gist}
        {note}
      </div>"""


def band_html(band):
    verses = ''.join(verse_html(v) for v in band['items'])
    return f"""
    <section class="band">
      <h2>{esc(band['label'])}<span class="bandnote">{esc(band.get('note',''))}</span></h2>
      {verses}
    </section>"""


def main():
    d = load_verses()
    groups = d['groups']
    # Two bands a sheet: 10 verses on the first, 14 on the second. Tried 3-and-1
    # to give the long class 8-10 verses room and it was worse — 17 verses will
    # not fit a page, so the second sheet has to carry the long ones instead.
    page1, page2 = groups[:2], groups[2:]

    CRITERIA = """
    <div class="criteria">
      <h3>How each recitation is scored &mdash; 10 marks each, 50 total</h3>
      <ol>
        <li><b>Pronunciation (Uchcharana)</b> &mdash; are the Sanskrit sounds clear and correct?</li>
        <li><b>Memory &amp; Accuracy</b> &mdash; recited from memory, without prompting or skipped lines.</li>
        <li><b>Tone &amp; Melody (Svara)</b> &mdash; steady rhythm and pleasing intonation.</li>
        <li><b>Confidence &amp; Presentation</b> &mdash; posture, voice reaching the room, composure.</li>
        <li><b>Overall Impression</b> &mdash; the feeling and sincerity the child brings.</li>
      </ol>
      <div class="tip">A student may recite <b>any</b> verse from the Bhagavad-gita, including one not printed here.
      Judge an unlisted verse exactly as you would a listed one &mdash; never mark a child down for choosing their own.
      Younger reciters may leave out an opening speaker line such as <i>dhrtarastra uvaca</i>.</div>
    </div>"""

    def page(bands, n, subtitle, extra='', balanced=False):
        return f"""
  <div class="page">
    <header>
      <div class="brand">UTKARSH <span>2026</span></div>
      <div class="title">Gita Shloka Recitation &middot; Judges' verse helper</div>
      <div class="sub">{subtitle}</div>
    </header>
    <div class="warn">{esc(d['lead'])}</div>
    <div class="cols{' balanced' if balanced else ''}">{''.join(band_html(b) for b in bands)}</div>{extra}
    <footer>ISKCON Guwahati, Ulubari &middot; 23 August 2026 &middot; page {n} of 2</footer>
  </div>"""

    html = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Utkarsh 2026 — Judges' verse helper</title>
<style>
  @page {{ size: A4 portrait; margin: 11mm 10mm 9mm; }}
  * {{ box-sizing: border-box; }}
  html, body {{ margin: 0; padding: 0; }}
  body {{
    font-family: "Iowan Old Style", Palatino, "Palatino Linotype", Georgia, serif;
    color: #1f2933; background: #fff;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }}
  .page {{ page-break-after: always; }}
  .page:last-child {{ page-break-after: auto; }}

  header {{ border-bottom: 2.2pt solid #C1440E; padding-bottom: 2.5mm; margin-bottom: 2.5mm; }}
  .brand {{ font-size: 15pt; font-weight: 700; letter-spacing: .16em; color: #C1440E; }}
  .brand span {{ color: #8a6d3b; font-weight: 400; }}
  .title {{ font-size: 10.5pt; font-weight: 700; margin-top: .6mm; }}
  .sub {{ font-size: 8pt; color: #6b7280; margin-top: .4mm; }}

  .warn {{
    border: .8pt solid #C1440E; background: #FDF3E3; color: #7a2c08;
    font-size: 8.2pt; font-weight: 700; line-height: 1.35;
    padding: 1.8mm 2.4mm; border-radius: 1.4mm; margin-bottom: 3mm;
  }}

  /* column-fill:auto needs a height to fill INTO — without one the columns keep
     growing and spill onto a third page. With one, anything that does not fit is
     CLIPPED AND SILENTLY LOST, which cost BG 16.1-3 on the first attempt, so the
     sizes below are the ones measured to fit with room to spare. If verses are
     ever added here, re-run and count them on the PDF before printing. */
  .cols {{ column-count: 2; column-gap: 7mm; column-fill: auto; height: 240mm; }}
  .cols.balanced {{ height: auto; column-fill: balance; }}

  .criteria {{ margin-top: 5mm; border: .8pt solid #d9c9a8; border-radius: 1.4mm; padding: 2.5mm 3mm; }}
  .criteria h3 {{ font-size: 8.5pt; margin: 0 0 1.6mm; color: #C1440E; letter-spacing: .04em; }}
  .criteria ol {{ margin: 0; padding-left: 4.5mm; column-count: 2; column-gap: 6mm; }}
  .criteria li {{ font-size: 7.6pt; line-height: 1.42; margin-bottom: .6mm; }}
  .criteria li b {{ color: #1f2933; }}
  .criteria .tip {{ font-size: 7.2pt; color: #6b7280; margin-top: 2mm; line-height: 1.4; border-top: .5pt solid #eee; padding-top: 1.6mm; }}

  .band {{ break-inside: avoid-column; margin-bottom: 1mm; }}
  .band h2 {{
    font-size: 9pt; margin: 0 0 1.6mm; padding: 1mm 2mm;
    background: #1f2933; color: #fff; border-radius: 1mm;
    display: flex; justify-content: space-between; align-items: baseline; gap: 2mm;
  }}
  .bandnote {{ font-size: 7.2pt; font-weight: 400; color: #f6d9b0; white-space: nowrap; }}

  .verse {{ break-inside: avoid; margin: 0 0 2.0mm; padding-left: 2mm; border-left: 1.6pt solid #E2C088; }}
  .ref {{ font-size: 8pt; font-weight: 700; color: #C1440E; letter-spacing: .04em; }}
  .sanskrit {{
    font-size: 8.2pt; line-height: 1.28; margin: .5mm 0 .7mm;
    font-style: italic; color: #14202b;
  }}
  .gist {{ font-size: 7.0pt; line-height: 1.3; color: #4b5563; }}
  .note {{ font-size: 6.8pt; line-height: 1.28; color: #8a6d3b; margin-top: .5mm; }}

  footer {{
    position: fixed; bottom: 3mm; left: 10mm; right: 10mm;
    font-size: 6.8pt; color: #9aa3ad; text-align: center;
    border-top: .5pt solid #e5e7eb; padding-top: 1mm;
  }}
</style></head>
<body>
{page(page1, 1, 'Classes 1 to 4 &middot; group A', CRITERIA, balanced=True)}
{page(page2, 2, 'Classes 5 to 10 &middot; groups B and C')}
</body></html>"""

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding='utf-8')
    n = sum(len(g['items']) for g in groups)
    print(f'{OUT.relative_to(ROOT)}  —  {n} verses over 2 pages')
    for g in groups:
        print(f"   {g['label']:<14} {len(g['items'])} verses")


if __name__ == '__main__':
    main()
