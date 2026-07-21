import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/home/david/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome", args:["--no-sandbox"] });
const O="/tmp/claude-1000/-home-david/8da55ca9-6a0e-403c-8ac2-325712b937c0/scratchpad";
const errs=[];
// 1. mobile hero stacking (390)
let p = await (await b.newContext({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:2})).newPage();
p.on("pageerror",e=>errs.push("mobile: "+e.message));
await p.goto("http://127.0.0.1:8899/",{waitUntil:"networkidle"}); await p.waitForTimeout(2500);
await p.screenshot({path:O+"/fix-mobile-hero.png"});
// scrollWidth check at 360
let m = await p.evaluate(()=>({sw:document.documentElement.scrollWidth, win:innerWidth}));
// 2. desktop hero early motes (1.6s)
let p2 = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
p2.on("pageerror",e=>errs.push("desk: "+e.message));
await p2.goto("http://127.0.0.1:8899/",{waitUntil:"networkidle"}); await p2.waitForTimeout(1600);
await p2.screenshot({path:O+"/fix-hero-early.png"});
// 3. skip link on Tab focus
await p2.keyboard.press("Tab"); await p2.waitForTimeout(200);
await p2.screenshot({path:O+"/fix-skip.png", clip:{x:0,y:0,width:520,height:90}});
// 4. bounded at 360
let p3 = await (await b.newContext({viewport:{width:360,height:780}})).newPage();
await p3.goto("http://127.0.0.1:8899/",{waitUntil:"networkidle"}); await p3.waitForTimeout(600);
const bw = await p3.evaluate(()=>document.documentElement.scrollWidth);
const el = await p3.$("#bounded"); await el.scrollIntoViewIfNeeded(); await p3.waitForTimeout(400);
await el.screenshot({path:O+"/fix-bounded-360.png"});
console.log("mobile scrollW/win:", JSON.stringify(m), "| 360 scrollW:", bw, "| errors:", errs.length?errs.join(" | "):"none");
await b.close();
