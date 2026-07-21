import { chromium } from "playwright-core";
const EXE = "/home/david/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome";
const URL = process.env.URL || "http://127.0.0.1:8899/";
const OUT = "/tmp/claude-1000/-home-david/8da55ca9-6a0e-403c-8ac2-325712b937c0/scratchpad";
const tag = process.argv[2] || "v2";

const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });

// Desktop, motion on
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(7000); // let HUD finish + enclave secure
await page.screenshot({ path: `${OUT}/${tag}-hero.png` });
await page.evaluate(() => document.querySelector("#hero").scrollIntoView());
await page.screenshot({ path: `${OUT}/${tag}-full.png`, fullPage: true });
for (const sel of ["#problem", "#turn", "#bounded", "#platform", "#architecture", "#approach", "#trust", "#compliance", "#audiences", "#contact"]) {
  const el = await page.$(sel);
  if (el) { await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(700); await el.screenshot({ path: `${OUT}/${tag}-sec-${sel.slice(1)}.png` }); }
}
await ctx.close();

// Reduced motion poster
const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce", deviceScaleFactor: 1 });
const p2 = await ctx2.newPage();
await p2.goto(URL, { waitUntil: "networkidle" });
await p2.waitForTimeout(1200);
await p2.screenshot({ path: `${OUT}/${tag}-hero-rm.png` });
await ctx2.close();

// Mobile
const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
const p3 = await ctx3.newPage();
await p3.goto(URL, { waitUntil: "networkidle" });
await p3.waitForTimeout(4000);
await p3.screenshot({ path: `${OUT}/${tag}-mobile.png`, fullPage: true });
await ctx3.close();

await browser.close();
console.log("shots done:", tag);
