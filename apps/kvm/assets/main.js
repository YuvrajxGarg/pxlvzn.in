// PXLVZN app sites: platform-aware download buttons from the app's latest GitHub
// release, the Lut before/after slider, and scroll reveals. The repo comes from
// <body data-repo>, so every app site runs this same file.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const REPO = document.body.dataset.repo;

  requestAnimationFrame(() => document.body.classList.add("ready"));

  // ---------------------------------------------------------------- nav border on scroll
  const nav = $("#nav");
  const onScroll = () => nav && nav.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------------------------------------------------------------- platform
  const ua = navigator.userAgent;
  const plat = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
  const isWin = /win/i.test(plat) || /Windows/.test(ua);
  const isMac = !isWin && (/mac/i.test(plat) || /Mac OS X/.test(ua)) && !/iPhone|iPad/.test(ua);

  const main = $("#cta-main"), alt = $("#cta-alt");
  const setBtn = (el, icon, label, href) => {
    if (!el) return;
    el.querySelector("use").setAttribute("href", icon);
    el.querySelector("span").textContent = label;
    if (href) el.href = href;
  };
  if (isWin) {
    setBtn(main, "#windows", "Download for Windows");
    setBtn(alt, "#apple", "Mac", "#download");
  }
  const current = $(`.platform[data-platform="${isWin ? "windows" : isMac ? "mac" : ""}"]`);
  if (current) {
    current.classList.add("current");
    current.querySelector(".btn").classList.replace("btn-quiet", "btn-primary");
    const other = $$(".platform").find((p) => p !== current);
    other && other.querySelector(".btn").classList.replace("btn-primary", "btn-quiet");
  }

  // ---------------------------------------------------------------- latest release
  // Installers first (Name.dmg, Name-Setup.exe), then the older zips (Name-mac.zip,
  // Name-windows.zip), matched loosely so a renamed build still gets picked up.
  const size = (b) => (b >= 1e9 ? (b / 1e9).toFixed(1) + " GB" : Math.round(b / 1e6) + " MB");
  const releases = `https://github.com/${REPO}/releases`;
  const soon = () => {
    // No release yet: say so instead of linking to a 404.
    document.documentElement.classList.add("is-soon");
    $$("[data-dl]").forEach((el) => (el.href = `https://github.com/${REPO}`));
    if (main) main.href = "#download";
  };
  fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((rel) => {
      const v = (rel.tag_name || "").replace(/^v/, "");
      if (v) $$("[data-version]").forEach((el) => (el.textContent = "Version " + v));
      const notes = $("[data-notes]");
      if (notes && rel.html_url) notes.href = rel.html_url;
      const assets = (rel.assets || []).filter((a) => !/\.(sha256|sig|txt|json)$/i.test(a.name));
      const pick = (re) => assets.find((a) => re.test(a.name));
      const mac = pick(/\.dmg$/i) || pick(/mac.*\.zip$/i);
      const win = pick(/setup.*\.exe$/i) || pick(/win.*\.(zip|exe|msi)$/i) || pick(/\.(exe|msi)$/i);
      const wire = (key, a) => {
        const href = a ? a.browser_download_url : rel.html_url || `${releases}/latest`;
        $$(`[data-dl="${key}"]`).forEach((el) => (el.href = href));
        if (a) $$(`[data-size="${key}"]`).forEach((el) => (el.textContent = size(a.size)));
        return href;
      };
      const macHref = wire("mac", mac), winHref = wire("windows", win);
      if ($('[data-dl="android"]')) wire("android", pick(/android.*\.apk$/i) || pick(/\.apk$/i));
      const name = document.title.split(" ")[0];
      const note = (key, html) => $$(`[data-note="${key}"]`).forEach((el) => (el.innerHTML = html));
      if (mac && /\.dmg$/i.test(mac.name)) note("mac", `Open it and drag <b>${name}</b> to Applications. The first time, right-click it and choose <b>Open</b>.`);
      if (win && /setup.*\.exe$/i.test(win.name)) note("windows", `Run the setup. It adds ${name} to the Start menu. If SmartScreen appears, click <b>More info</b>, then <b>Run anyway</b>.`);
      if (main) main.href = isWin ? winHref : macHref;
    })
    .catch((status) => { if (status === 404) soon(); /* otherwise the static links still work */ });

  // ---------------------------------------------------------------- before/after slider (Lut)
  $$(".grade").forEach((g) => {
    const set = (clientX) => {
      const r = g.getBoundingClientRect();
      const x = Math.min(96, Math.max(4, ((clientX - r.left) / r.width) * 100));
      g.style.setProperty("--x", x + "%");
    };
    let down = false;
    g.addEventListener("pointerdown", (e) => { down = true; g.setPointerCapture(e.pointerId); set(e.clientX); });
    g.addEventListener("pointermove", (e) => { if (down || e.pointerType === "mouse") set(e.clientX); });
    g.addEventListener("pointerup", () => (down = false));
    g.addEventListener("pointerleave", () => { if (!down) g.style.setProperty("--x", "50%"); });
  });

  // ---------------------------------------------------------------- hopping file (Hop)
  // Follows the same curve as the dashed arc: M0,110 Q50,-40 100,110 in a 100×120 box.
  const hopper = $(".hopper i");
  if (hopper && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const q = (a, b, c, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
    const tick = (now) => {
      const p = (now % 2600) / 2600;
      const t = Math.min(1, p / 0.7);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      hopper.style.left = q(0, 50, 100, e) + "%";
      hopper.style.top = (q(110, -40, 110, e) / 120) * 100 + "%";
      hopper.style.opacity = p > 0.85 ? String(1 - (p - 0.85) / 0.15) : "1";
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------------- Syn resting mark
  // Lines the outlined SVG up on the live intro's baseline, so the cross-fade doesn't jump.
  const syn = $(".hero-mark.anim-syn");
  if (syn) {
    const place = () => {
      const w = $(".synw", syn), bl = $(".bl", syn), img = $("img.rest", syn);
      const fs = parseFloat(getComputedStyle(syn).fontSize);
      img.style.top = (w.offsetTop + bl.offsetTop - (1159 / 2048) * fs).toFixed(2) + "px";
      img.style.left = (w.offsetLeft - (82 / 2048) * fs).toFixed(2) + "px";
      syn.classList.add("placed");
    };
    place();
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(place);
    addEventListener("resize", place);
  }

  // ---------------------------------------------------------------- dot-matrix bar (Dsk)
  // The same bar as the app: segments of glowing cells, brighter toward each segment's end,
  // twinkling. Rest on a segment to light it up. Fills in like a scan on first sight.
  const dsk = $(".dsk-bar canvas");
  if (dsk) {
    const sizes = dsk.dataset.sizes.split(",").map(Number), total = +dsk.dataset.total;
    const colors = dsk.dataset.colors.split(","), names = dsk.dataset.names.split(",");
    const tip = $(".dsk-tip"), cats = $(".dsk-cats");
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const PITCH = 8, CELL = 5.5, PAD = 18;
    let w, h, dpr, cols, rows, ox, oy, seeds, hot = -1, t0 = performance.now(), fill = still ? 1 : 0;
    const size = () => {
      const r = dsk.getBoundingClientRect();
      dpr = devicePixelRatio || 1; w = r.width; h = r.height;
      dsk.width = Math.round(w * dpr); dsk.height = Math.round(h * dpr);
      cols = Math.floor((w - PAD * 2 + PITCH - CELL) / PITCH); rows = Math.floor((h - PAD * 2 + PITCH - CELL) / PITCH);
      ox = PAD + (w - PAD * 2 - (cols * PITCH - (PITCH - CELL))) / 2; oy = PAD + (h - PAD * 2 - (rows * PITCH - (PITCH - CELL))) / 2;
      seeds = new Float32Array(cols * rows * 2).map(() => Math.random());
    };
    const spans = () => {
      let acc = 0; const out = [];
      sizes.forEach((v, i) => {
        const a = Math.round(acc / total * cols * fill), b = Math.round((acc + v) / total * cols * fill);
        acc += v;
        if (b > a) out.push({ i, c0: a, c1: b });
      });
      return out;
    };
    const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
    let started = false;
    const draw = (now) => {
      if (started && fill < 1) fill = Math.min(1, fill + 0.012);
      const ctx = dsk.getContext("2d"), t = (now - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      const S = spans(), end = S.length ? S[S.length - 1].c1 : 0;
      ctx.fillStyle = "rgba(255,255,255,.055)";
      for (let c = end; c < cols; c++) for (let r = 0; r < rows; r++) ctx.fillRect(ox + c * PITCH, oy + r * PITCH, CELL, CELL);
      S.forEach((s, k) => {
        const col = colors[s.i], dim = hot >= 0 && hot !== s.i, width = s.c1 - s.c0;
        for (let c = s.c0; c < s.c1; c++) {
          const edge = (c - s.c0 + 1) / width;
          for (let r = 0; r < rows; r++) {
            const j = (c * rows + r) * 2, a = seeds[j], b = seeds[j + 1];
            const lit = a > 0.86 - edge * 0.22 - (hot === s.i ? 0.12 : 0) || Math.sin(t * (0.6 + b * 1.6) + a * 6.283) > 0.985 - edge * 0.05;
            let alpha = lit ? 0.95 : 0.22 + 0.16 * edge * b;
            if (dim) alpha *= 0.28;
            const white = lit && b > 0.7 && !dim;
            ctx.fillStyle = white ? "#fff" : col; ctx.globalAlpha = white ? 0.85 : alpha;
            ctx.fillRect(ox + c * PITCH, oy + r * PITCH, CELL, CELL);
          }
        }
        ctx.globalAlpha = 1;
        const x0 = ox + s.c0 * PITCH - 2.5, x1 = ox + s.c1 * PITCH - (PITCH - CELL) + 2.5, y0 = oy - 2.5, y1 = oy + rows * PITCH - (PITCH - CELL) + 2.5;
        ctx.save(); ctx.strokeStyle = hexA(col, dim ? 0.3 : 0.95); ctx.lineWidth = 2; ctx.shadowColor = col; ctx.shadowBlur = dim ? 0 : hot === s.i ? 22 : 12;
        ctx.beginPath();
        const rr = [k === 0 ? 12 : 3, k === S.length - 1 ? 12 : 3, k === S.length - 1 ? 12 : 3, k === 0 ? 12 : 3];
        ctx.roundRect ? ctx.roundRect(x0, y0, x1 - x0, y1 - y0, rr) : ctx.rect(x0, y0, x1 - x0, y1 - y0);
        ctx.stroke(); ctx.restore();
      });
      if (!still) requestAnimationFrame(draw);
    };
    const setHot = (i, x) => {
      hot = i;
      tip.classList.toggle("on", i >= 0);
      if (i >= 0) { tip.innerHTML = `<b>${names[i]}</b>${$$(".dsk-cat em")[i].textContent}`; tip.style.left = Math.max(40, Math.min(w - 2 * PAD - 40, x)) + "px"; }
      cats.classList.toggle("hovering", i >= 0);
      $$(".dsk-cat").forEach((el, k) => el.classList.toggle("hot", k === i));
      if (still) requestAnimationFrame(draw);
    };
    dsk.addEventListener("pointermove", (e) => {
      const r = dsk.getBoundingClientRect(), x = e.clientX - r.left, c = Math.floor((x - ox) / PITCH);
      const s = spans().find((sp) => c >= sp.c0 && c < sp.c1);
      setHot(s ? s.i : -1, x - PAD);
    });
    dsk.addEventListener("pointerleave", () => setHot(-1));
    $$(".dsk-cat").forEach((el, i) => {
      el.addEventListener("pointerenter", () => { const s = spans().find((sp) => sp.i === i); setHot(s ? i : -1, s ? ox + (s.c0 + s.c1) / 2 * PITCH - PAD : 0); });
      el.addEventListener("pointerleave", () => setHot(-1));
    });
    size();
    addEventListener("resize", () => { size(); if (still) requestAnimationFrame(draw); });
    if ("IntersectionObserver" in window && !still) {
      const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { started = true; io.disconnect(); } }, { threshold: 0.3 });
      io.observe(dsk);
    } else started = true;
    requestAnimationFrame(draw);
  }

  // ---------------------------------------------------------------- reveals
  const items = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach((el, i) => { el.style.transitionDelay = (i % 3) * 60 + "ms"; io.observe(el); });
  } else {
    items.forEach((el) => el.classList.add("in"));
  }
})();
