const PptxGenJS = require("pptxgenjs");
const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const LOGO_SRC = path.join(ROOT, "uob-logo.png");
const LOGO = path.join(__dirname, "uob-logo-rgb.png");
const OUT = path.join(ROOT, "Shor-Algorithm-ITCS411.pptx");

// Flatten alpha → white background for maximum PPTX compatibility
try {
  execFileSync("sips", [
    "-s", "format", "png",
    "--deleteColorManagementProperties",
    LOGO_SRC,
    "--out", LOGO,
  ], { stdio: "pipe" });
  // composite onto white via sips is limited; use python pillow if available, else keep png
} catch (_) {
  fs.copyFileSync(LOGO_SRC, LOGO);
}

try {
  execFileSync("python3", ["-c", `
from PIL import Image
im = Image.open(${JSON.stringify(LOGO_SRC)}).convert("RGBA")
bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
bg.paste(im, mask=im.split()[3])
bg.convert("RGB").save(${JSON.stringify(LOGO)}, "PNG")
print("logo flattened")
`], { stdio: "pipe" });
} catch (_) {
  if (!fs.existsSync(LOGO)) fs.copyFileSync(LOGO_SRC, LOGO);
}

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "LAYOUT_WIDE", width: 13.333, height: 7.5 });
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Fazil Mohammad Shahbaz";
pptx.title = "Shor Algorithm - Finding the Period";
pptx.subject = "ITCS 411";

const C = {
  paper: "F3EFE6",
  panel: "FFFDF8",
  ink: "14212B",
  muted: "5A6B78",
  accent: "0D7C66",
  accentSoft: "D8EFE8",
  focus: "1F4FD8",
  warn: "C45C26",
  warnSoft: "F6E3D6",
  line: "D7D0C4",
  white: "FFFFFF",
  node: "5F7383",
  ghost: "EFEAE0",
};

function bg(slide) {
  slide.background = { color: C.paper };
}

function footer(slide, n, total) {
  slide.addText("Fazil Mohammad Shahbaz  |  ITCS 411  |  University of Bahrain", {
    x: 0.5, y: 7.05, w: 10, h: 0.3,
    fontSize: 11, color: C.muted, fontFace: "Calibri",
  });
  slide.addText(`${n} / ${total}`, {
    x: 11.3, y: 7.05, w: 1.5, h: 0.3,
    fontSize: 11, color: C.muted, fontFace: "Calibri", align: "right",
  });
}

function header(slide, label) {
  if (fs.existsSync(LOGO)) {
    slide.addImage({ path: LOGO, x: 0.5, y: 0.28, w: 0.4, h: 0.4 });
  }
  slide.addText("Shor's Algorithm", {
    x: 1.05, y: 0.25, w: 5, h: 0.25,
    fontSize: 13, bold: true, color: C.ink, fontFace: "Calibri",
  });
  slide.addText(label, {
    x: 1.05, y: 0.48, w: 8, h: 0.22,
    fontSize: 11, color: C.accent, fontFace: "Calibri",
  });
}

function card(slide, x, y, w, h, fill, line) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    fill: { color: fill || C.panel },
    line: { color: line || C.line, width: 1 },
    rectRadius: 0.08,
  });
}

/** Safe ring: nodes only, no LINE shapes (negative w/h corrupts PPTX) */
function ring(slide, opts) {
  const { show = 0, cur = null, half = null, period = false, factors = false } = opts;
  const seq = [1, 2, 4, 8, 1];
  const cx = 10.0;
  const cy = 3.55;
  const R = 1.7;
  const n = seq.length;

  // hub
  slide.addShape(pptx.shapes.OVAL, {
    x: cx - 0.65, y: cy - 0.65, w: 1.3, h: 1.3,
    fill: { color: factors ? C.accentSoft : "F7F3EA" },
    line: { color: factors ? C.accent : C.line, width: 1.25 },
  });
  slide.addText(factors ? "3 x 5" : "mod 15", {
    x: cx - 0.65, y: cy - 0.2, w: 1.3, h: 0.25,
    fontSize: 13, bold: true, color: C.ink, fontFace: "Calibri", align: "center", valign: "middle",
  });
  slide.addText(factors ? "= 15" : "a = 2", {
    x: cx - 0.65, y: cy + 0.08, w: 1.3, h: 0.2,
    fontSize: 10, color: C.muted, fontFace: "Calibri", align: "center",
  });

  for (let idx = 0; idx < n; idx += 1) {
    const ang = -Math.PI / 2 + (idx / n) * Math.PI * 2;
    const x = cx + Math.cos(ang) * R;
    const y = cy + Math.sin(ang) * R;
    const visible = idx <= show;
    const isCur = cur === idx && visible;
    const isHalf = half === idx;
    const isPeriod = period && (idx === 0 || idx === 4);

    let fill = C.node;
    if (!visible) fill = C.ghost;
    else if (isHalf) fill = C.warn;
    else if (isPeriod) fill = C.accent;
    else if (isCur) fill = C.focus;

    const r = isCur ? 0.3 : 0.26;
    slide.addShape(pptx.shapes.OVAL, {
      x: x - r, y: y - r, w: r * 2, h: r * 2,
      fill: { color: fill },
      line: { color: C.white, width: 1 },
    });

    if (visible) {
      slide.addText(String(seq[idx]), {
        x: x - r, y: y - 0.11, w: r * 2, h: 0.22,
        fontSize: 13, bold: true, color: C.white, fontFace: "Calibri", align: "center",
      });
      slide.addText("c=" + idx, {
        x: x - 0.3, y: y + r + 0.02, w: 0.6, h: 0.18,
        fontSize: 9, color: C.muted, fontFace: "Calibri", align: "center",
      });
    }
  }

  // sequence strip under ring (instead of arcs)
  const shown = seq.slice(0, show + 1).join("  →  ");
  slide.addText("Sequence:  " + shown + (show >= 4 ? "   (period closes)" : ""), {
    x: 7.6, y: 5.85, w: 5.2, h: 0.3,
    fontSize: 12, color: C.ink, fontFace: "Calibri", align: "center",
  });
}

function chips(slide, vals, y0) {
  const items = [
    ["N", vals.N],
    ["helper a", vals.a],
    ["period r", vals.r],
    ["factors", vals.pq],
  ];
  items.forEach((it, i) => {
    const x = 0.5 + (i % 2) * 1.9;
    const y = y0 + Math.floor(i / 2) * 0.75;
    card(slide, x, y, 1.75, 0.65);
    slide.addText(it[0].toUpperCase(), {
      x: x + 0.1, y: y + 0.08, w: 1.55, h: 0.18,
      fontSize: 9, color: C.muted, fontFace: "Calibri",
    });
    slide.addText(String(it[1]), {
      x: x + 0.1, y: y + 0.28, w: 1.55, h: 0.28,
      fontSize: 16, bold: true, color: C.ink, fontFace: "Calibri",
    });
  });
}

const TOTAL = 10;

// 1 Title
{
  const s = pptx.addSlide();
  bg(s);
  if (fs.existsSync(LOGO)) {
    s.addImage({ path: LOGO, x: 6.15, y: 1.2, w: 1.0, h: 1.0 });
  }
  s.addText("Shor's Algorithm", {
    x: 0.8, y: 2.5, w: 11.7, h: 0.7,
    fontSize: 40, bold: true, color: C.ink, fontFace: "Calibri", align: "center",
  });
  s.addText("Factoring by finding a period", {
    x: 0.8, y: 3.25, w: 11.7, h: 0.45,
    fontSize: 22, color: C.accent, fontFace: "Calibri", align: "center",
  });
  s.addText("How a quantum computer breaks RSA by discovering\nthe hidden period in modular exponentiation", {
    x: 2.2, y: 3.95, w: 9, h: 0.7,
    fontSize: 15, color: C.muted, fontFace: "Calibri", align: "center",
  });
  s.addText("Fazil Mohammad Shahbaz  |  ITCS 411  |  University of Bahrain", {
    x: 0.8, y: 5.3, w: 11.7, h: 0.35,
    fontSize: 14, color: C.ink, fontFace: "Calibri", align: "center",
  });
  footer(s, 1, TOTAL);
}

// 2 Idea
{
  const s = pptx.addSlide();
  bg(s);
  header(s, "01  |  The idea");
  s.addText("Factoring by finding a period", {
    x: 0.5, y: 1.0, w: 7.2, h: 0.45,
    fontSize: 26, bold: true, color: C.ink, fontFace: "Calibri",
  });
  s.addText("RSA hides two primes inside N. Shor never guesses them — it builds a repeating list and reads how long the loop is.", {
    x: 0.5, y: 1.55, w: 7.2, h: 0.7,
    fontSize: 15, color: C.ink, fontFace: "Calibri",
  });
  chips(s, { N: "15", a: "2", r: "—", pq: "—" }, 2.4);
  card(s, 0.5, 4.1, 7.2, 1.5);
  s.addText("Core formula", {
    x: 0.7, y: 4.25, w: 6.8, h: 0.25,
    fontSize: 12, bold: true, color: C.accent, fontFace: "Calibri",
  });
  s.addText("A[c] = a^c  mod  N", {
    x: 0.7, y: 4.6, w: 6.8, h: 0.4,
    fontSize: 24, bold: true, color: C.focus, fontFace: "Calibri",
  });
  s.addText("Each node on the ring is one remainder. When the path returns to 1, we know the period r.", {
    x: 0.7, y: 5.15, w: 6.8, h: 0.3,
    fontSize: 13, color: C.muted, fontFace: "Calibri",
  });
  ring(s, { show: 0, cur: 0 });
  footer(s, 2, TOTAL);
}

// 3 Start
{
  const s = pptx.addSlide();
  bg(s);
  header(s, "02  |  Start at 1");
  s.addText("A[0] is always 1", {
    x: 0.5, y: 1.0, w: 7.2, h: 0.45,
    fontSize: 26, bold: true, color: C.ink, fontFace: "Calibri",
  });
  s.addText("Every next node is: multiply by a, then take remainder mod N. Watch the orbit grow.", {
    x: 0.5, y: 1.55, w: 7.2, h: 0.55,
    fontSize: 15, color: C.ink, fontFace: "Calibri",
  });
  card(s, 0.5, 2.4, 7.2, 1.2, "F7F3EA");
  s.addText("A[0] = 2^0 mod 15 = 1", {
    x: 0.7, y: 2.8, w: 6.8, h: 0.4,
    fontSize: 22, bold: true, color: C.focus, fontFace: "Calibri", align: "center",
  });
  ring(s, { show: 0, cur: 0 });
  footer(s, 3, TOTAL);
}

const walks = [
  { page: 4, label: "03  |  Multiply to 2", title: "Walk one step around the ring", formula: "1 x 2 = 2", body: "Take remainder 1, multiply by helper a = 2, place the new remainder on the ring.", show: 1, cur: 1 },
  { page: 5, label: "04  |  Multiply to 4", title: "Walk one step around the ring", formula: "2 x 2 = 4", body: "Take remainder 2, multiply by helper a = 2, place the new remainder on the ring.", show: 2, cur: 2 },
  { page: 6, label: "05  |  Multiply to 8", title: "Walk one step around the ring", formula: "4 x 2 = 8", body: "Take remainder 4, multiply by helper a = 2, place the new remainder on the ring.", show: 3, cur: 3 },
  { page: 7, label: "06  |  Loop closes", title: "We landed back on 1", formula: "8 x 2 = 16  →  16 - 15 = 1", body: "After 4 multiplications the remainder is 1 again. That count is the period r. On a huge RSA modulus, a quantum computer's job is just to find this r.", show: 4, cur: 4 },
];

walks.forEach((w) => {
  const s = pptx.addSlide();
  bg(s);
  header(s, w.label);
  s.addText(w.title, {
    x: 0.5, y: 1.0, w: 7.2, h: 0.45,
    fontSize: 26, bold: true, color: C.ink, fontFace: "Calibri",
  });
  card(s, 0.5, 1.65, 7.2, 0.9);
  s.addText(w.formula, {
    x: 0.7, y: 1.9, w: 6.8, h: 0.4,
    fontSize: 20, bold: true, color: C.focus, fontFace: "Calibri", align: "center",
  });
  s.addText(w.body, {
    x: 0.5, y: 2.8, w: 7.2, h: 1.1,
    fontSize: 15, color: C.ink, fontFace: "Calibri",
  });
  ring(s, { show: w.show, cur: w.cur });
  footer(s, w.page, TOTAL);
});

// 8 Period
{
  const s = pptx.addSlide();
  bg(s);
  header(s, "07  |  Period r = 4");
  s.addText("r = 4", {
    x: 0.5, y: 1.0, w: 7.2, h: 0.45,
    fontSize: 26, bold: true, color: C.ink, fontFace: "Calibri",
  });
  s.addText("The ring has closed. Count the steps from the first 1 back to the next 1.", {
    x: 0.5, y: 1.55, w: 7.2, h: 0.45,
    fontSize: 15, color: C.ink, fontFace: "Calibri",
  });
  chips(s, { N: "15", a: "2", r: "4", pq: "—" }, 2.2);
  card(s, 0.5, 3.9, 7.2, 1.4, C.accentSoft, C.accent);
  s.addText("Period r = 4   |   A[0] = A[4] = 1", {
    x: 0.7, y: 4.25, w: 6.8, h: 0.35,
    fontSize: 18, bold: true, color: C.ink, fontFace: "Calibri", align: "center",
  });
  s.addText("r is even, so we can continue to the classical finish.", {
    x: 0.7, y: 4.75, w: 6.8, h: 0.3,
    fontSize: 13, color: C.muted, fontFace: "Calibri", align: "center",
  });
  ring(s, { show: 4, period: true, cur: 0 });
  footer(s, 8, TOTAL);
}

// 9 Halfway
{
  const s = pptx.addSlide();
  bg(s);
  header(s, "08  |  Halfway value m");
  s.addText("Read the halfway node", {
    x: 0.5, y: 1.0, w: 7.2, h: 0.45,
    fontSize: 26, bold: true, color: C.ink, fontFace: "Calibri",
  });
  s.addText("Do not add and subtract from r. Look at the value sitting at index r/2.", {
    x: 0.5, y: 1.55, w: 7.2, h: 0.5,
    fontSize: 15, color: C.ink, fontFace: "Calibri",
  });
  card(s, 0.5, 2.3, 7.2, 1.6, C.warnSoft, C.warn);
  s.addText("m = A[r / 2] = A[2]", {
    x: 0.7, y: 2.55, w: 6.8, h: 0.3,
    fontSize: 14, bold: true, color: C.warn, fontFace: "Calibri", align: "center",
  });
  s.addText("m = 2^2 mod 15 = 4", {
    x: 0.7, y: 3.05, w: 6.8, h: 0.45,
    fontSize: 24, bold: true, color: C.ink, fontFace: "Calibri", align: "center",
  });
  ring(s, { show: 4, period: true, half: 2, cur: 2 });
  footer(s, 9, TOTAL);
}

// 10 Finish
{
  const s = pptx.addSlide();
  bg(s);
  header(s, "09-10  |  From m +/- 1 to the primes");
  s.addText("15 = 3 x 5", {
    x: 0.5, y: 1.0, w: 7.2, h: 0.45,
    fontSize: 28, bold: true, color: C.ink, fontFace: "Calibri",
  });
  s.addText("Form (m - 1) and (m + 1), then take gcd with N.", {
    x: 0.5, y: 1.5, w: 7.2, h: 0.4,
    fontSize: 15, color: C.ink, fontFace: "Calibri",
  });

  card(s, 0.5, 2.1, 3.45, 1.35, C.warnSoft, C.warn);
  s.addText("Split", {
    x: 0.7, y: 2.25, w: 3.05, h: 0.25,
    fontSize: 12, bold: true, color: C.warn, fontFace: "Calibri",
  });
  s.addText("m - 1 = 3\nm + 1 = 5", {
    x: 0.7, y: 2.6, w: 3.05, h: 0.65,
    fontSize: 18, bold: true, color: C.ink, fontFace: "Calibri",
  });

  card(s, 4.15, 2.1, 3.55, 1.35, C.accentSoft, C.accent);
  s.addText("gcd pulls the primes", {
    x: 4.35, y: 2.25, w: 3.15, h: 0.25,
    fontSize: 12, bold: true, color: C.accent, fontFace: "Calibri",
  });
  s.addText("gcd(3, 15) = 3\ngcd(5, 15) = 5", {
    x: 4.35, y: 2.6, w: 3.15, h: 0.65,
    fontSize: 18, bold: true, color: C.ink, fontFace: "Calibri",
  });

  card(s, 0.5, 3.7, 7.2, 2.5);
  s.addText("Takeaway", {
    x: 0.7, y: 3.9, w: 6.8, h: 0.25,
    fontSize: 13, bold: true, color: C.accent, fontFace: "Calibri",
  });
  s.addText("1. Build the ring  A[c] = a^c mod N\n2. Read the period r when it returns to 1\n3. Read halfway value m = A[r/2]\n4. Compute gcd(m +/- 1, N)  →  the secret primes\n\nQuantum finds r. Classical gcd finishes the factorisation.", {
    x: 0.7, y: 4.25, w: 6.8, h: 1.75,
    fontSize: 15, color: C.ink, fontFace: "Calibri",
  });

  ring(s, { show: 4, period: true, half: 2, factors: true });
  footer(s, 10, TOTAL);
}

pptx
  .writeFile({ fileName: OUT })
  .then(() => {
    // validate zip + required parts
    const zipfile = require("fs");
    const { execSync } = require("child_process");
    execSync(`python3 - <<'PY'
import zipfile, sys
p = ${JSON.stringify(OUT)}
z = zipfile.ZipFile(p)
need = ["[Content_Types].xml", "ppt/presentation.xml", "ppt/slides/slide1.xml"]
for n in need:
    z.read(n)
print("OK slides", sum(1 for x in z.namelist() if x.startswith("ppt/slides/slide") and x.endswith(".xml")))
print("OK size", __import__("os").path.getsize(p))
PY`);
    console.log("Wrote", OUT);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
