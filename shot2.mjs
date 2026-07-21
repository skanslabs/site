import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/home/david/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome", args:["--no-sandbox"] });
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto("http://127.0.0.1:8899/", { waitUntil:"networkidle" });
await p.waitForTimeout(1200);
const O="/tmp/claude-1000/-home-david/8da55ca9-6a0e-403c-8ac2-325712b937c0/scratchpad";
for (const s of ["platform","architecture","audiences","contact"]) {
  const el = await p.$("#"+s); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
  await el.screenshot({ path:`${O}/v4-${s}.png` });
}
await b.close(); console.log("ok");
