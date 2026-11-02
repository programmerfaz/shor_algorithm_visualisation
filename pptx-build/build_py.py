#!/usr/bin/env python3
"""Clean, PowerPoint-safe Shor Algorithm presentation."""

from __future__ import annotations

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Inches, Pt, Emu
from lxml import etree

ROOT = Path(__file__).resolve().parent.parent
LOGO = Path(__file__).resolve().parent / "uob-logo-rgb.png"
OUT = ROOT / "Shor-Algorithm-ITCS411.pptx"

W = Inches(13.333)
H = Inches(7.5)
TOTAL = 10

INK = RGBColor(0x14, 0x21, 0x2B)
MUTED = RGBColor(0x5A, 0x6B, 0x78)
ACCENT = RGBColor(0x0D, 0x7C, 0x66)
ACCENT_SOFT = RGBColor(0xD8, 0xEF, 0xE8)
FOCUS = RGBColor(0x1F, 0x4F, 0xD8)
WARN = RGBColor(0xC4, 0x5C, 0x26)
WARN_SOFT = RGBColor(0xF6, 0xE3, 0xD6)
PAPER = RGBColor(0xF7, 0xF4, 0xEE)
PANEL = RGBColor(0xFF, 0xFF, 0xFF)
LINE = RGBColor(0xD7, 0xD0, 0xC4)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
NODE = RGBColor(0x4A, 0x63, 0x74)
GHOST = RGBColor(0xE4, 0xDE, 0xD3)


def set_slide_bg(slide, color: RGBColor):
    """Set solid background via XML — no giant rectangle (avoids Office repair issues)."""
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color


def style_run(run, size=16, bold=False, color=INK):
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = "Calibri"


def textbox(slide, left, top, width, height, text, size=16, bold=False, color=INK, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    tf.auto_size = None
    try:
        tf._txBody.bodyPr.set("anchor", {MSO_ANCHOR.TOP: "t", MSO_ANCHOR.MIDDLE: "ctr", MSO_ANCHOR.BOTTOM: "b"}[anchor])
    except Exception:
        pass
    p = tf.paragraphs[0]
    p.alignment = align
    # support multiline
    lines = text.split("\n")
    for i, line in enumerate(lines):
        if i == 0:
            run = p.add_run()
            run.text = line
            style_run(run, size=size, bold=bold, color=color)
        else:
            np = tf.add_paragraph()
            np.alignment = align
            run = np.add_run()
            run.text = line
            style_run(run, size=size, bold=bold, color=color)
    return box


def rounded(slide, left, top, width, height, fill=PANEL, line=LINE):
    sh = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    sh.fill.solid()
    sh.fill.fore_color.rgb = fill
    sh.line.color.rgb = line
    sh.line.width = Pt(1.25)
    # softer corners
    try:
        sh.adjustments[0] = 0.15
    except Exception:
        pass
    return sh


def oval(slide, left, top, width, height, fill, line=WHITE):
    sh = slide.shapes.add_shape(MSO_SHAPE.OVAL, left, top, width, height)
    sh.fill.solid()
    sh.fill.fore_color.rgb = fill
    sh.line.color.rgb = line
    sh.line.width = Pt(1.5)
    return sh


def footer(slide, n):
    textbox(
        slide, Inches(0.55), Inches(7.05), Inches(9.5), Inches(0.28),
        "Fazil Mohammad Shahbaz  ·  ITCS 411  ·  University of Bahrain",
        size=11, color=MUTED,
    )
    textbox(
        slide, Inches(11.2), Inches(7.05), Inches(1.5), Inches(0.28),
        f"{n} / {TOTAL}", size=11, color=MUTED, align=PP_ALIGN.RIGHT,
    )


def header(slide, label):
    if LOGO.exists():
        slide.shapes.add_picture(str(LOGO), Inches(0.55), Inches(0.3), Inches(0.38), Inches(0.38))
    textbox(slide, Inches(1.08), Inches(0.26), Inches(6), Inches(0.24), "Shor's Algorithm", size=13, bold=True)
    textbox(slide, Inches(1.08), Inches(0.48), Inches(9), Inches(0.22), label, size=12, color=ACCENT)


def metric_row(slide, items, top):
    """Four metric chips in one row."""
    gap = 0.18
    width = 1.85
    left0 = 0.55
    for i, (lab, val) in enumerate(items):
        x = Inches(left0 + i * (width + gap))
        rounded(slide, x, top, Inches(width), Inches(0.72))
        textbox(slide, x + Inches(0.12), top + Inches(0.08), Inches(width - 0.2), Inches(0.2), lab.upper(), size=9, color=MUTED)
        textbox(slide, x + Inches(0.12), top + Inches(0.32), Inches(width - 0.2), Inches(0.3), str(val), size=18, bold=True)


def sequence_bar(slide, show, cur=None, half=None, period=False, top=Inches(5.35)):
    """Horizontal sequence visualization — clean and Office-safe."""
    seq = [1, 2, 4, 8, 1]
    labels = ["c=0", "c=1", "c=2", "c=3", "c=4"]
    start_x = 0.7
    y = top
    size = 0.72
    gap = 1.55

    textbox(slide, Inches(0.55), y - Inches(0.38), Inches(4), Inches(0.28), "Remainder sequence A[c]", size=12, bold=True, color=MUTED)

    for i, val in enumerate(seq):
        x = Inches(start_x + i * gap)
        visible = i <= show
        if not visible:
            fill = GHOST
        elif half is not None and i == half:
            fill = WARN
        elif period and i in (0, 4):
            fill = ACCENT
        elif cur is not None and i == cur:
            fill = FOCUS
        else:
            fill = NODE

        oval(slide, x, y, Inches(size), Inches(size), fill if visible else GHOST)
        if visible:
            textbox(
                slide, x, y + Inches(0.18), Inches(size), Inches(0.35),
                str(val), size=18, bold=True, color=WHITE, align=PP_ALIGN.CENTER,
            )
        textbox(
            slide, x - Inches(0.1), y + Inches(size + 0.05), Inches(size + 0.2), Inches(0.22),
            labels[i], size=11, color=MUTED, align=PP_ALIGN.CENTER,
        )

        if i < len(seq) - 1:
            # arrow as text, not a line shape with negative size
            ax = Inches(start_x + i * gap + size + 0.12)
            textbox(slide, ax, y + Inches(0.18), Inches(0.5), Inches(0.35), "→", size=20, color=ACCENT if i < show else GHOST, align=PP_ALIGN.CENTER)

    # legend
    legend_y = y + Inches(1.15)
    bits = [
        (FOCUS, "current"),
        (ACCENT, "period ends"),
        (WARN, "halfway m"),
        (NODE, "remainder"),
    ]
    lx = 0.55
    for color, lab in bits:
        oval(slide, Inches(lx), legend_y, Inches(0.18), Inches(0.18), color)
        textbox(slide, Inches(lx + 0.24), legend_y - Inches(0.02), Inches(1.3), Inches(0.22), lab, size=11, color=MUTED)
        lx += 1.7


def content_card(slide, left, top, width, height, title, body, fill=PANEL, accent=ACCENT):
    rounded(slide, left, top, width, height, fill=fill)
    textbox(slide, left + Inches(0.25), top + Inches(0.18), width - Inches(0.5), Inches(0.28), title, size=12, bold=True, color=accent)
    textbox(slide, left + Inches(0.25), top + Inches(0.5), width - Inches(0.5), height - Inches(0.7), body, size=16, color=INK)


def blank(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, PAPER)
    return slide


def build():
    # Ensure RGB logo exists
    src = ROOT / "uob-logo.png"
    if src.exists() and not LOGO.exists():
        try:
            from PIL import Image
            im = Image.open(src).convert("RGBA")
            bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
            bg.paste(im, mask=im.split()[3])
            bg.convert("RGB").save(LOGO, "PNG")
        except Exception:
            LOGO.write_bytes(src.read_bytes())

    prs = Presentation()
    prs.slide_width = W
    prs.slide_height = H

    # —— 1 Title ——
    s = blank(prs)
    if LOGO.exists():
        s.shapes.add_picture(str(LOGO), Inches(6.2), Inches(1.15), Inches(0.95), Inches(0.95))
    textbox(s, Inches(1), Inches(2.45), Inches(11.3), Inches(0.7), "Shor's Algorithm", size=42, bold=True, align=PP_ALIGN.CENTER)
    textbox(s, Inches(1), Inches(3.2), Inches(11.3), Inches(0.45), "Factoring by finding a period", size=24, color=ACCENT, align=PP_ALIGN.CENTER)
    textbox(
        s, Inches(2.3), Inches(3.9), Inches(8.7), Inches(0.7),
        "How period-finding turns modular exponentiation into the prime factors of an RSA modulus",
        size=16, color=MUTED, align=PP_ALIGN.CENTER,
    )
    rounded(s, Inches(3.8), Inches(5.0), Inches(5.7), Inches(0.7), fill=ACCENT_SOFT, line=ACCENT)
    textbox(s, Inches(3.8), Inches(5.15), Inches(5.7), Inches(0.4), "Fazil Mohammad Shahbaz  ·  ITCS 411", size=15, bold=True, align=PP_ALIGN.CENTER)
    footer(s, 1)

    # —— 2 Idea ——
    s = blank(prs)
    header(s, "01  ·  The idea")
    textbox(s, Inches(0.55), Inches(1.0), Inches(12), Inches(0.45), "Factoring by finding a period", size=28, bold=True)
    textbox(
        s, Inches(0.55), Inches(1.55), Inches(12.2), Inches(0.55),
        "RSA hides two primes inside N. Shor never guesses them — it builds a repeating list and reads how long the loop is.",
        size=17,
    )
    metric_row(s, [("N", "15"), ("helper a", "2"), ("period r", "—"), ("factors", "—")], Inches(2.3))
    content_card(
        s, Inches(0.55), Inches(3.3), Inches(12.2), Inches(1.5),
        "Core formula",
        "A[c] = a^c  mod  N\n\nEach value A[c] is a remainder. When the sequence returns to 1, that length is the period r.",
    )
    footer(s, 2)

    # —— 3 Start ——
    s = blank(prs)
    header(s, "02  ·  Start at 1")
    textbox(s, Inches(0.55), Inches(1.0), Inches(12), Inches(0.45), "A[0] is always 1", size=28, bold=True)
    textbox(
        s, Inches(0.55), Inches(1.55), Inches(12.2), Inches(0.5),
        "Every next value is: multiply by a, then take remainder mod N. Watch the sequence grow.",
        size=17,
    )
    rounded(s, Inches(0.55), Inches(2.3), Inches(12.2), Inches(1.2), fill=ACCENT_SOFT, line=ACCENT)
    textbox(s, Inches(0.55), Inches(2.65), Inches(12.2), Inches(0.5), "A[0] = 2^0 mod 15 = 1", size=28, bold=True, color=FOCUS, align=PP_ALIGN.CENTER)
    sequence_bar(s, show=0, cur=0)
    footer(s, 3)

    walks = [
        (4, "03  ·  Multiply → 2", "1 × 2 = 2", "Take remainder 1, multiply by helper a = 2.", 1),
        (5, "04  ·  Multiply → 4", "2 × 2 = 4", "Take remainder 2, multiply by helper a = 2.", 2),
        (6, "05  ·  Multiply → 8", "4 × 2 = 8", "Take remainder 4, multiply by helper a = 2.", 3),
        (7, "06  ·  Loop closes", "8 × 2 = 16 → 16 − 15 = 1", "Back to 1 after 4 steps. That length is the period r.", 4),
    ]
    for page, label, formula, body, show in walks:
        s = blank(prs)
        header(s, label)
        textbox(s, Inches(0.55), Inches(1.0), Inches(12), Inches(0.4), "Walk one step" if show < 4 else "We landed back on 1", size=28, bold=True)
        rounded(s, Inches(0.55), Inches(1.6), Inches(12.2), Inches(1.15))
        textbox(s, Inches(0.55), Inches(1.85), Inches(12.2), Inches(0.4), formula, size=26, bold=True, color=FOCUS, align=PP_ALIGN.CENTER)
        textbox(s, Inches(0.55), Inches(2.35), Inches(12.2), Inches(0.3), body, size=15, color=MUTED, align=PP_ALIGN.CENTER)
        if show == 4:
            textbox(
                s, Inches(0.55), Inches(3.0), Inches(12.2), Inches(0.55),
                "On a huge RSA modulus, a quantum computer’s only hard job is to find this r. The rest is ordinary arithmetic.",
                size=16, align=PP_ALIGN.CENTER,
            )
            sequence_bar(s, show=show, cur=show, top=Inches(4.0))
        else:
            sequence_bar(s, show=show, cur=show, top=Inches(3.7))
        footer(s, page)

    # —— 8 Period ——
    s = blank(prs)
    header(s, "07  ·  Period r = 4")
    textbox(s, Inches(0.55), Inches(1.0), Inches(12), Inches(0.4), "r = 4", size=28, bold=True)
    textbox(s, Inches(0.55), Inches(1.5), Inches(12.2), Inches(0.4), "Count steps from the first 1 back to the next 1.", size=17)
    metric_row(s, [("N", "15"), ("helper a", "2"), ("period r", "4"), ("factors", "—")], Inches(2.1))
    rounded(s, Inches(0.55), Inches(3.05), Inches(12.2), Inches(1.0), fill=ACCENT_SOFT, line=ACCENT)
    textbox(s, Inches(0.55), Inches(3.2), Inches(12.2), Inches(0.35), "Period r = 4    ·    A[0] = A[4] = 1", size=22, bold=True, align=PP_ALIGN.CENTER)
    textbox(s, Inches(0.55), Inches(3.6), Inches(12.2), Inches(0.3), "r is even, so we continue to the classical finish.", size=14, color=MUTED, align=PP_ALIGN.CENTER)
    sequence_bar(s, show=4, period=True, cur=0, top=Inches(4.5))
    footer(s, 8)

    # —— 9 Halfway ——
    s = blank(prs)
    header(s, "08  ·  Halfway value m")
    textbox(s, Inches(0.55), Inches(1.0), Inches(12), Inches(0.4), "Read the halfway node", size=28, bold=True)
    textbox(s, Inches(0.55), Inches(1.5), Inches(12.2), Inches(0.4), "Do not add/subtract from r. Read the value at index r/2.", size=17)
    rounded(s, Inches(0.55), Inches(2.15), Inches(12.2), Inches(1.35), fill=WARN_SOFT, line=WARN)
    textbox(s, Inches(0.55), Inches(2.4), Inches(12.2), Inches(0.3), "m = A[r / 2] = A[2]", size=16, bold=True, color=WARN, align=PP_ALIGN.CENTER)
    textbox(s, Inches(0.55), Inches(2.85), Inches(12.2), Inches(0.4), "m = 2² mod 15 = 4", size=28, bold=True, align=PP_ALIGN.CENTER)
    sequence_bar(s, show=4, period=True, half=2, cur=2, top=Inches(4.2))
    footer(s, 9)

    # —— 10 Finish ——
    s = blank(prs)
    header(s, "09–10  ·  From m ± 1 to the primes")
    textbox(s, Inches(0.55), Inches(1.0), Inches(12), Inches(0.4), "15 = 3 × 5", size=30, bold=True)
    textbox(s, Inches(0.55), Inches(1.5), Inches(12.2), Inches(0.35), "Form (m − 1) and (m + 1), then take gcd with N.", size=17)

    rounded(s, Inches(0.55), Inches(2.05), Inches(5.9), Inches(1.35), fill=WARN_SOFT, line=WARN)
    textbox(s, Inches(0.8), Inches(2.2), Inches(5.4), Inches(0.28), "Split", size=13, bold=True, color=WARN)
    textbox(s, Inches(0.8), Inches(2.6), Inches(5.4), Inches(0.6), "m − 1 = 3\nm + 1 = 5", size=22, bold=True)

    rounded(s, Inches(6.85), Inches(2.05), Inches(5.9), Inches(1.35), fill=ACCENT_SOFT, line=ACCENT)
    textbox(s, Inches(7.1), Inches(2.2), Inches(5.4), Inches(0.28), "gcd pulls the primes", size=13, bold=True, color=ACCENT)
    textbox(s, Inches(7.1), Inches(2.6), Inches(5.4), Inches(0.6), "gcd(3, 15) = 3\ngcd(5, 15) = 5", size=22, bold=True)

    metric_row(s, [("N", "15"), ("helper a", "2"), ("period r", "4"), ("factors", "3 × 5")], Inches(3.65))

    rounded(s, Inches(0.55), Inches(4.6), Inches(12.2), Inches(2.1))
    textbox(s, Inches(0.8), Inches(4.8), Inches(11.7), Inches(0.28), "Takeaway", size=14, bold=True, color=ACCENT)
    textbox(
        s, Inches(0.8), Inches(5.2), Inches(11.7), Inches(1.3),
        "1. Build A[c] = a^c mod N\n"
        "2. Read period r when the sequence returns to 1\n"
        "3. Read halfway value m = A[r/2]\n"
        "4. Compute gcd(m ± 1, N) → the secret primes\n"
        "Quantum finds r. Classical gcd finishes the factorisation.",
        size=16,
    )
    footer(s, 10)

    if OUT.exists():
        OUT.unlink()
    prs.save(str(OUT))

    # Validate
    from pptx import Presentation as P2
    check = P2(str(OUT))
    assert len(check.slides) == TOTAL
    print(f"Wrote {OUT}")
    print(f"Size: {OUT.stat().st_size:,} bytes")
    print(f"Slides: {len(check.slides)}")


if __name__ == "__main__":
    build()
