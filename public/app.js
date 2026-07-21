/* SKANS — interactions. Dependency-free. All motion one-shot; respects reduced-motion. */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fmt = function (n) { return Math.round(n).toLocaleString("en-US"); };

  /* sticky header */
  var header = document.querySelector(".site-header");
  var onScroll = function () { if (header) header.classList.toggle("scrolled", scrollY > 8); };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* theme toggle — default theme is set inline in <head>; this persists a manual choice */
  var themeBtn = document.querySelector(".theme-toggle");
  if (themeBtn) {
    var syncPressed = function () { themeBtn.setAttribute("aria-pressed", document.documentElement.getAttribute("data-theme") === "light" ? "true" : "false"); };
    syncPressed();
    themeBtn.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("skans-theme", next); } catch (e) {}
      syncPressed();
    });
  }

  /* mobile nav */
  var toggle = document.querySelector(".nav-toggle"), menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") { menu.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  /* count-up helper (ease-out) */
  function countUp(el, to, dur, suffix, startGate) {
    if (reduce) { el.textContent = fmt(to) + (suffix || ""); return; }
    var t0 = null;
    function tick(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(to * e) + (suffix || "");
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(to) + (suffix || "");
    }
    requestAnimationFrame(tick);
  }

  /* hero HUD: probes race, findings settle calm */
  var probes = document.getElementById("hud-probes"), findings = document.getElementById("hud-findings");
  if (probes) {
    if (reduce) { probes.textContent = "248"; if (findings) findings.textContent = "2"; }
    else {
      setTimeout(function () { countUp(probes, 248, 2400, ""); }, 500);
      if (findings) setTimeout(function () { countUp(findings, 2, 1700, ""); }, 1100);
    }
  }

  /* reveal-on-scroll */
  var reveals = [].slice.call(document.querySelectorAll(".reveal"));
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
    document.querySelectorAll(".draw-path").forEach(function (p) { p.classList.add("in"); });
    document.querySelectorAll(".stat-num[data-count]").forEach(function (el) {
      el.textContent = fmt(+el.dataset.count) + (el.dataset.suffix || "");
    });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add("in");
        el.querySelectorAll && el.querySelectorAll(".draw-path").forEach(function (p) { p.classList.add("in"); });
        if (el.classList.contains("stat")) {
          var num = el.querySelector(".stat-num[data-count]");
          if (num && !num.dataset.done) { num.dataset.done = "1"; countUp(num, +num.dataset.count, 1400, num.dataset.suffix || ""); }
        }
        io.unobserve(el);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -60px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* scatter the raw-event swarm dots */
  var swarm = document.getElementById("swarm");
  if (swarm) {
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 64; i++) {
      var d = document.createElement("i");
      d.style.left = (Math.random() * 100) + "%";
      d.style.top = (Math.random() * 100) + "%";
      d.style.opacity = (0.25 + Math.random() * 0.4).toFixed(2);
      frag.appendChild(d);
    }
    swarm.appendChild(frag);
  }

  /* copy-email -> "SECURED ✓" */
  var copyBtn = document.querySelector(".copy-email");
  if (copyBtn) {
    var label = copyBtn.querySelector(".copy-label"), original = label.textContent, busy = false;
    var status = document.getElementById("copy-status");
    copyBtn.addEventListener("click", function () {
      if (busy) return; busy = true;
      var email = copyBtn.dataset.email;
      var done = function () {
        copyBtn.classList.add("copied"); label.textContent = "Email copied — secured ✓";
        if (status) status.textContent = "Email address copied to clipboard — secured.";
        setTimeout(function () { copyBtn.classList.remove("copied"); label.textContent = original; if (status) status.textContent = ""; busy = false; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(done, done);
      } else {
        var ta = document.createElement("textarea"); ta.value = email; document.body.appendChild(ta);
        ta.select(); try { document.execCommand("copy"); } catch (e) {} document.body.removeChild(ta); done();
      }
    });
  }
})();
