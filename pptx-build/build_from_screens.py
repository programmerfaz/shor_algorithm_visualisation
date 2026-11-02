#!/usr/bin/env python3
"""PPTX built from live website screenshots — looks like the web demo."""

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

ROOT = Path(__file__).resolve().parent.parent
SCREENS = Path(__file__).resolve().parent / "screens"
LOGO = Path(__file__).resolve().parent / "uob-logo-rgb.png"
OUT = ROOT / "Shor-Algorithm-ITCS411.pptx"

W = Inches(13.333)
H = Inches(7.5)

INK = RGBColor(0x14, 0x21, 0x2B)
MUTED = RGBColor(0x5A, 0x6B, 0x78)
ACCENT = RGBColor(0x0D, 0x7C, 0x66)
PAPER = RGBColor(0xF3, 0xEF, 0xE6)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

# Screenshot slides: (image, short caption for speaker bar)
SLIDES = [
    ("02-idea.png", "01  ·  The idea — factoring by finding a period"),
    ("03-start.png", "02  ·  Start at A[0] = 1"),
    ("04-mult1.png", "03  ·  Multiply: 1 × 2 = 2"),
    ("05-mult2.png", "04  ·  Multiply: 2 × 2 = 4"),
    ("06-mult3.png", "05  ·  Multiply: 4 × 2 = 8"),
    ("07-close.png", "06  ·  Loop closes — back to 1"),
    ("08-period.png", "07  ·  Period r = 4"),
    ("09-halfway.png", "08  ·  Halfway value m = 4"),
    ("10-split.png", "09  ·  Split m ± 1 → 3 and 5"),
    ("11-factors.png", "10  ·  gcd → 15 = 3 × 5"),
]


def set_bg(slide, color):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_text(slide, left, top, width, height, text, size=14, bold=False, color=INK, align=PP_ALIGN.LEFT):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = "Calibri"
    return box


def main():
    missing = [name for name, _ in SLIDES if not (SCREENS / name).exists()]
    if missing:
        raise SystemExit(f"Missing screenshots: {missing}")

    prs = Presentation()
    prs.slide_width = W
    prs.slide_height = H
    blank = prs.slide_layouts[6]

    # —— Title ——
    s = prs.slides.add_slide(blank)
    set_bg(s, PAPER)
    if LOGO.exists():
        s.shapes.add_picture(str(LOGO), Inches(6.2), Inches(1.2), Inches(0.95), Inches(0.95))
    add_text(s, Inches(0.8), Inches(2.45), Inches(11.7), Inches(0.65), "Shor's Algorithm", size=40, bold=True, align=PP_ALIGN.CENTER)
    add_text(s, Inches(0.8), Inches(3.2), Inches(11.7), Inches(0.4), "Factoring by finding a period", size=22, color=ACCENT, align=PP_ALIGN.CENTER)
    add_text(
        s, Inches(2.0), Inches(3.85), Inches(9.3), Inches(0.6),
        "Visual walkthrough screenshots from the interactive demo  ·  Example N = 15, a = 2",
        size=15, color=MUTED, align=PP_ALIGN.CENTER,
    )
    add_text(
        s, Inches(0.8), Inches(5.2), Inches(11.7), Inches(0.35),
        "Fazil Mohammad Shahbaz  ·  ITCS 411  ·  University of Bahrain",
        size=14, align=PP_ALIGN.CENTER,
    )
    add_text(s, Inches(0.55), Inches(7.05), Inches(12), Inches(0.25), "1 / 11", size=11, color=MUTED, align=PP_ALIGN.RIGHT)

    # —— Screenshot slides ——
    # Wide screenshot, keep aspect ratio, caption under it
    img_w = Inches(12.9)
    img_left = Inches(0.22)
    img_top = Inches(0.15)

    total = 1 + len(SLIDES)
    for n, (name, caption) in enumerate(SLIDES, start=2):
        s = prs.slides.add_slide(blank)
        set_bg(s, PAPER)
        path = SCREENS / name
        pic = s.shapes.add_picture(str(path), img_left, img_top, width=img_w)
        # if image is too tall, shrink to fit above caption
        max_h = Inches(6.55)
        if pic.height > max_h:
            ratio = max_h / pic.height
            pic.height = max_h
            pic.width = int(pic.width * ratio)
            pic.left = int((W - pic.width) / 2)
        add_text(s, Inches(0.4), Inches(6.9), Inches(10.5), Inches(0.35), caption, size=14, bold=True, color=INK)
        add_text(s, Inches(11.2), Inches(6.9), Inches(1.7), Inches(0.35), f"{n} / {total}", size=12, color=MUTED, align=PP_ALIGN.RIGHT)

    if OUT.exists():
        OUT.unlink()
    prs.save(str(OUT))

    check = Presentation(str(OUT))
    print(f"Wrote {OUT}")
    print(f"Size: {OUT.stat().st_size:,} bytes")
    print(f"Slides: {len(check.slides)}")


if __name__ == "__main__":
    main()
