import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/home/david/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome", args:["--no-sandbox"] });
const widths = [1920,1728,1600,1536,1440,1366,1280,1100,1024,900,820,768,430,414,390,375,360];
console.log("width  overflow?  scrollW  heroH  pageH");
for (const w of widths) {
  const mob = w <= 500;
  const ctx = await b.newContext({ viewport:{width:w, height: mob?800:900}, isMobile:mob, deviceScaleFactor: mob?2:1 });
  const p = await ctx.newPage();
  await p.goto("http://127.0.0.1:8899/", { waitUntil:"domcontentloaded" });
  await p.waitForTimeout(700);
  const d = await p.evaluate(() => ({
    sw: document.documentElement.scrollWidth, win: innerWidth,
    hero: Math.round(document.querySelector("#hero").getBoundingClientRect().height),
    page: document.documentElement.scrollHeight
  }));
  const over = d.sw > d.win ? "OVERFLOW +"+(d.sw-d.win) : "ok";
  console.log(String(w).padEnd(6), over.padEnd(13), d.sw, "   ", d.hero, "  ", d.page);
  await ctx.close();
}
await b.close();
