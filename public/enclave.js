/* SKANS — "THE SEAM" hero. Dependency-free canvas. DPR-capped, fps-gated,
   paused offscreen/hidden. Reduced-motion paints one secured poster frame.
   Color law: azure only AS / right of the seam; steel motes never cross it. */
(function () {
  "use strict";
  var canvas = document.getElementById("enclave");
  if (!canvas) return;
  var ctx = canvas.getContext("2d", { alpha: false });
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var C = { bg: "#0a0d12", steel: "#8b97a7", dim: "#46505f", accent: "#38bdf8", accent2: "#34d3c1", label: "#9fb0c3" };
  var TAGS = ["port-scan", "beacon", "cve-probe", "syn-flood", "dns-exfil", "rdp-brute", "smb-enum"];
  var LABELS = ["CAMERA-07 · agentless", "SERVER-2025 · agent", "PLC-04 · OT", "EDGE-01 · collector",
                "WS-22 · workstation", "SWITCH-3 · snmp", "HMI-02 · OT", "APP-09 · agent"];

  var W = 0, H = 0, DPR = 1, seamX = 0, t = 0, lastTs = 0, raf = 0, running = false;
  var bend = 0, bendTarget = 0;
  var pointer = { x: 0, y: 0, active: false };
  var motes = [], sparks = [], nodes = [], hex = [], ground = [];
  var bloomSprite = null, sparkSprite = null, seamGrad = null;
  var MOTE_N = 120, SPARK_N = 64;

  function rnd(a, b) { return a + (b - a) * Math.random(); }
  function lerp(a, b, n) { return a + (b - a) * n; }

  /* pre-render glow sprites once (no per-frame shadowBlur) */
  function makeSprites() {
    var r = 26;
    bloomSprite = document.createElement("canvas"); bloomSprite.width = bloomSprite.height = r * 2;
    var b = bloomSprite.getContext("2d");
    var g = b.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, "rgba(56,189,248,0.55)"); g.addColorStop(0.5, "rgba(56,189,248,0.14)"); g.addColorStop(1, "rgba(56,189,248,0)");
    b.fillStyle = g; b.beginPath(); b.arc(r, r, r, 0, 7); b.fill();

    var s = 16;
    sparkSprite = document.createElement("canvas"); sparkSprite.width = sparkSprite.height = s * 2;
    var sp = sparkSprite.getContext("2d");
    var sg = sp.createRadialGradient(s, s, 0, s, s, s);
    sg.addColorStop(0, "rgba(120,225,255,0.95)"); sg.addColorStop(0.4, "rgba(56,189,248,0.5)"); sg.addColorStop(1, "rgba(56,189,248,0)");
    sp.fillStyle = sg; sp.beginPath(); sp.arc(s, s, s, 0, 7); sp.fill();
  }

  function layout() {
    seamX = W * (W < 760 ? 0.4 : 0.5);
    /* enclave shield-hexagon (flat-top) on the right */
    var cx = lerp(seamX, W, W < 760 ? 0.62 : 0.52);
    var cy = H * 0.52;
    var R = Math.min(W - seamX, H) * (W < 760 ? 0.5 : 0.46);
    hex = [];
    for (var i = 0; i < 6; i++) {
      var a = Math.PI / 6 + i * Math.PI / 3;
      hex.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
    }
    /* mountain ground line inside lower hex */
    ground = [
      { x: cx - R * 0.86, y: cy + R * 0.62 }, { x: cx - R * 0.3, y: cy + R * 0.04 },
      { x: cx - R * 0.04, y: cy + R * 0.34 }, { x: cx + R * 0.26, y: cy - R * 0.06 },
      { x: cx + R * 0.86, y: cy + R * 0.62 }
    ];
    /* nodes on a jittered lattice inside the hex */
    nodes = [];
    var want = W < 760 ? 26 : 42, tries = 0, li = 0;
    while (nodes.length < want && tries < want * 12) {
      tries++;
      var px = rnd(cx - R * 0.82, cx + R * 0.82);
      var py = rnd(cy - R * 0.74, cy + R * 0.66);
      if (!inHex(px, py, cx, cy, R)) continue;
      var labeled = nodes.length % 5 === 0 && li < LABELS.length;
      nodes.push({
        x: px, y: py, delay: rnd(0.1, 5.4),
        label: labeled ? LABELS[li++] : null,
        seed: Math.random()
      });
    }
  }

  function inHex(x, y, cx, cy, R) {
    var dx = Math.abs(x - cx) / R, dy = Math.abs(y - cy) / R;
    return dx < 0.84 && dy < 0.92 && (dx * 0.5 + dy * 0.5 < 0.86);
  }

  function initMote(m, spread) {
    m.x = rnd(-0.05 * W, seamX - 6);
    if (!spread) m.x = rnd(-0.06 * W, -0.005 * W);
    m.y = rnd(0, H);
    m.v = rnd(6, 15);
    m.a = rnd(0.28, 0.6);
    m.r = rnd(0.8, 1.9);
    m.tag = Math.random() < 0.14 ? TAGS[(Math.random() * TAGS.length) | 0] : null;
    return m;
  }

  function setup() {
    motes = []; for (var i = 0; i < MOTE_N; i++) motes.push(initMote({}, true));
    sparks = []; for (var j = 0; j < SPARK_N; j++) sparks.push({ life: 0, x: 0, y: 0 });
  }

  function emitSpark(y) {
    for (var i = 0; i < sparks.length; i++) if (sparks[i].life <= 0) { sparks[i].life = 1; sparks[i].x = seamX; sparks[i].y = y; return; }
  }

  function step(dt) {
    t += dt;
    /* pointer lean */
    bendTarget = pointer.active && !reduce ? Math.max(-14, Math.min(14, (pointer.x - seamX) * 0.25)) : 0;
    bend = lerp(bend, bendTarget, 0.06);
    /* motes */
    for (var i = 0; i < motes.length; i++) {
      var m = motes[i];
      var bias = pointer.active ? (1 + 0.6 * Math.exp(-Math.abs(m.y - pointer.y) / 80)) : 1;
      m.x += m.v * dt * bias;
      m.y += Math.sin((t + i) * 0.6) * 2 * dt;
      if (m.x >= seamGuard(m.y) - 2) { emitSpark(m.y); initMote(m, false); }
    }
    /* sparks */
    for (var s = 0; s < sparks.length; s++) if (sparks[s].life > 0) sparks[s].life -= dt * 2.2;
  }

  function seamXAt(y) {
    /* bulge toward pointer.y */
    var influence = pointer.active ? Math.exp(-Math.abs(y - pointer.y) / 140) : 0;
    return seamX + bend * influence;
  }
  /* guard so steel/motes never paint right of EITHER the nominal or bent seam */
  function seamGuard(y) { return Math.min(seamX, seamXAt(y)); }

  function draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);

    /* faint shield-hex frame + mountain ground (steel, brand-as-architecture) */
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(139,151,167,0.14)"; ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 0; i < hex.length; i++) { var p = hex[i]; i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }
    ctx.closePath(); ctx.stroke();
    ctx.strokeStyle = "rgba(139,151,167,0.10)";
    ctx.beginPath();
    for (var g = 0; g < ground.length; g++) { var q = ground[g]; g ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }
    ctx.stroke();

    /* enclave nodes (right of seam) */
    for (var n = 0; n < nodes.length; n++) drawNode(nodes[n]);

    /* cloud motes (left only — hard clamp) */
    for (var m = 0; m < motes.length; m++) {
      var d = motes[m]; if (d.x >= seamGuard(d.y) - 2) continue;
      ctx.globalAlpha = d.a;
      ctx.fillStyle = C.steel;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fill();
      if (d.tag && d.x > seamX * 0.34) {
        ctx.globalAlpha = Math.min(0.5, d.a) * ((d.x - seamX * 0.34) / (seamX * 0.66));
        ctx.fillStyle = C.dim; ctx.font = "10px Inter, sans-serif"; ctx.textAlign = "right";
        ctx.fillText(d.tag, d.x - 5, d.y + 3);
      }
      ctx.globalAlpha = 1;
    }

    /* annihilation sparks (azure, at the seam) */
    ctx.globalCompositeOperation = "lighter";
    for (var s = 0; s < sparks.length; s++) {
      var sk = sparks[s]; if (sk.life <= 0) continue;
      var sz = 26 * sk.life;
      ctx.globalAlpha = sk.life;
      ctx.drawImage(sparkSprite, seamXAt(sk.y) - sz, sk.y - sz, sz * 2, sz * 2);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";

    drawSeam();
  }

  function drawNode(nd) {
    var age = t - nd.delay;
    if (age < 0) return;
    var x = nd.x, y = nd.y;
    /* state timeline: 0-.6 discover, .6-1.2 classify, 1.2-1.9 secure(ring), >1.9 armed */
    var pop = Math.min(1, age / 0.4);
    ctx.globalAlpha = 0.85 * pop;
    ctx.fillStyle = C.steel;
    ctx.beginPath(); ctx.arc(x, y, 1.8, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;

    if (age > 1.2) {
      var ringP = Math.min(1, (age - 1.2) / 0.7);
      ctx.strokeStyle = "rgba(56,189,248," + (0.9 - 0.62 * Math.max(0, (age - 1.9))) + ")";
      if (age > 1.9) ctx.strokeStyle = "rgba(56,189,248,0.32)";
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(x, y, 6, -Math.PI / 2, -Math.PI / 2 + ringP * Math.PI * 2); ctx.stroke();
      if (age > 1.5 && age < 2.4) { /* secure pulse */
        var pp = (age - 1.5) / 0.9;
        ctx.globalAlpha = 1 - pp; ctx.globalCompositeOperation = "lighter";
        ctx.drawImage(bloomSprite, x - 16, y - 16, 32, 32);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      }
    }
    if (nd.label && age > 0.7) {
      ctx.globalAlpha = Math.min(1, (age - 0.7) / 0.6) * 0.92;
      ctx.fillStyle = C.label; ctx.font = "10px Inter, sans-serif"; ctx.textAlign = "left";
      ctx.fillText(nd.label, x + 11, y + 3.5);
      ctx.globalAlpha = 1;
    }
  }

  function drawSeam() {
    var breathe = 0.78 + 0.22 * Math.sin(t * (Math.PI * 2 / 7));
    /* soft bloom column */
    ctx.globalCompositeOperation = "lighter";
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "rgba(52,211,193,0)"); grad.addColorStop(0.5, "rgba(56,189,248," + (0.10 * breathe) + ")"); grad.addColorStop(1, "rgba(52,211,193,0)");
    ctx.fillStyle = grad; ctx.fillRect(seamX - 18, 0, 36, H);
    ctx.globalCompositeOperation = "source-over";

    /* the seam core (gradient cached in resize — no per-frame alloc) */
    ctx.strokeStyle = seamGrad || "#38bdf8"; ctx.lineWidth = 2; ctx.globalAlpha = breathe;
    ctx.beginPath();
    for (var y = 0; y <= H; y += 12) { var sx = seamXAt(y); y ? ctx.lineTo(sx, y) : ctx.moveTo(sx, y); }
    ctx.stroke(); ctx.globalAlpha = 1;

    /* travelling live segment */
    var ly = (((t * 0.06) % 1)) * H;
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.9;
    ctx.drawImage(bloomSprite, seamXAt(ly) - 22, ly - 40, 44, 80);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }

  function frame(ts) {
    if (!running) return;
    if (!lastTs) { lastTs = ts; raf = requestAnimationFrame(frame); return; } /* seed the clock */
    var dt = (ts - lastTs) / 1000;
    if (dt < 0.026) { raf = requestAnimationFrame(frame); return; } /* ~36fps gate */
    lastTs = ts; if (dt > 0.05) dt = 0.05;
    step(dt); draw();
    raf = requestAnimationFrame(frame);
  }

  function start() { if (running || reduce) return; running = true; lastTs = 0; raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height || (innerHeight * 0.92);
    DPR = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    layout();
    seamGrad = ctx.createLinearGradient(0, 0, 0, H);
    seamGrad.addColorStop(0, "rgba(52,211,193,0)"); seamGrad.addColorStop(0.12, "#34d3c1");
    seamGrad.addColorStop(0.46, "#38bdf8"); seamGrad.addColorStop(0.82, "#8b8cf6"); seamGrad.addColorStop(1, "rgba(139,140,246,0)");
    if (reduce) { poster(); }
    else { for (var i = 0; i < motes.length; i++) initMote(motes[i], true); draw(); } /* re-seed motes now that W/H are real */
  }

  /* reduced-motion: one composed, fully-secured frame */
  function poster() {
    t = 9999; bend = 0;
    setup();
    /* freeze motes as a faint band pressing the seam */
    for (var i = 0; i < motes.length; i++) { motes[i].x = rnd(-0.05 * W, seamX - 8); motes[i].tag = null; }
    draw();
  }

  /* events */
  var rT;
  addEventListener("resize", function () { clearTimeout(rT); rT = setTimeout(resize, 150); }, { passive: true });
  var onscreen = true, visible = true;
  function update() { (onscreen && visible && !reduce) ? start() : stop(); } /* AND both pause sources */
  if (!reduce) {
    canvas.parentElement.addEventListener("pointermove", function (e) {
      var rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left; pointer.y = e.clientY - rect.top; pointer.active = true;
    }, { passive: true });
    canvas.parentElement.addEventListener("pointerleave", function () { pointer.active = false; });
    document.addEventListener("visibilitychange", function () { visible = !document.hidden; update(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { onscreen = en[0].isIntersecting; update(); }, { threshold: 0.01 }).observe(canvas);
    }
  }

  makeSprites(); setup(); resize();
  if (!reduce) start();
})();
