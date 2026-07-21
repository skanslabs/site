import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/home/david/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome", args:["--no-sandbox"] });
const p = await (await b.newContext({viewport:{width:390,height:844}, isMobile:true, deviceScaleFactor:2})).newPage();
await p.goto("http://127.0.0.1:8899/", { waitUntil:"networkidle" });
await p.waitForTimeout(1500);
const data = await p.evaluate(() => {
  const out = { scrollH: document.documentElement.scrollHeight, bodyScrollW: document.body.scrollWidth, win: innerWidth };
  out.sections = [...document.querySelectorAll("section, .seam-link, footer, header")].map(s => ({
    id: s.id || s.className.split(" ")[0], h: Math.round(s.getBoundingClientRect().height)
  })).filter(s => s.h > 400);
  return out;
});
console.log(JSON.stringify(data, null, 1));
await b.close();
