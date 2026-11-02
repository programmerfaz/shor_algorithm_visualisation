const { chromium } = require("playwright-core");
const path = require("path");
const fs = require("fs");

const OUT = path.join(__dirname, "screens");
fs.mkdirSync(OUT, { recursive: true });

const STEPS = [
  { file: "01-title.png", i: 0, note: "title-ish first step" },
  { file: "02-idea.png", i: 0 },
  { file: "03-start.png", i: 1 },
  { file: "04-step1.png", i: 2 },
  { file: "05-step2.png", i: 3 },
  { file: "06-step3.png", i: 4 },
  { file: "07-close.png", i: 5 },
  { file: "08-period.png", i: 6 },
  { file: "09-halfway.png", i: 7 },
  { file: "10-split.png", i: 8 },
  { file: "11-factors.png", i: 9 },
];

(async () => {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  await page.goto("http://localhost:8765/?capture=1", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  // hide nothing critical; ensure we're on example 15·2
  await page.evaluate(() => {
    // stop any autoplay if present
    const play = document.getElementById("play");
    if (play && play.textContent.toLowerCase().includes("pause")) play.click();
  });

  for (const step of STEPS) {
    await page.evaluate((idx) => {
      // access go via clicking step or dispatching key / internal
      // The IIFE doesn't expose go. Drive via next/prev from start.
    }, step.i);

    // reset to start then advance
    await page.evaluate(() => {
      // click prev many times then next
    });
  }

  // Better: inject a helper by reloading with hash and patching
  await page.goto("http://localhost:8765/?capture=1", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);

  // Expose navigation by clicking next from 0
  const goTo = async (target) => {
    // jump by evaluating DOM events: click to-start equivalent via many prev, then next
    for (let k = 0; k < 15; k++) {
      await page.click("#prev");
      await page.waitForTimeout(20);
    }
    for (let k = 0; k < target; k++) {
      await page.click("#next");
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(350); // let animations settle
  };

  // Title slide: capture hero-looking first frame
  await goTo(0);
  await page.screenshot({ path: path.join(OUT, "01-website.png"), type: "png" });

  const map = [
    ["02-idea.png", 0],
    ["03-start.png", 1],
    ["04-mult1.png", 2],
    ["05-mult2.png", 3],
    ["06-mult3.png", 4],
    ["07-close.png", 5],
    ["08-period.png", 6],
    ["09-halfway.png", 7],
    ["10-split.png", 8],
    ["11-factors.png", 9],
  ];

  for (const [file, idx] of map) {
    await goTo(idx);
    await page.screenshot({ path: path.join(OUT, file), type: "png" });
    console.log("saved", file);
  }

  await browser.close();
  console.log("done", OUT);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
