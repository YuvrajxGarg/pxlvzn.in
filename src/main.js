// PXLVZN site: platform-aware PXL downloads from the latest release, the app list
// from apps.json (the same file PXL reads), the screenshot switch, the hero pixel
// wave and scroll reveals.
import "./style.css";

const REPO = "YuvrajxGarg/pxl";
const REGISTRY = `https://raw.githubusercontent.com/${REPO}/main/apps.json`;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

requestAnimationFrame(() => document.body.classList.add("ready"));

// ------------------------------------------------------------------ nav
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("scrolled", scrollY > 8);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ------------------------------------------------------------------ platform
const ua = navigator.userAgent;
const plat = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
const isWin = /win/i.test(plat) || /Windows/.test(ua);
const isMac = !isWin && (/mac/i.test(plat) || /Mac OS X/.test(ua)) && !/iPhone|iPad/.test(ua);
const main = $("#cta-main"), alt = $("#cta-alt");
const setBtn = (el, icon, label, href) => {
  el.querySelector("use").setAttribute("href", icon);
  el.querySelector("span").textContent = label;
  if (href) el.href = href;
};
if (isWin) {
  setBtn(main, "#windows", "Download for Windows", `https://github.com/${REPO}/releases/latest/download/PXL-windows.zip`);
  setBtn(alt, "#apple", "Mac", "#download");
}
const current = $(`.platform[data-platform="${isWin ? "windows" : isMac ? "mac" : ""}"]`);
if (current) {
  current.classList.add("current");
  current.querySelector(".btn").classList.replace("btn-quiet", "btn-primary");
  const other = $$(".platform").find((p) => p !== current);
  other && other.querySelector(".btn").classList.replace("btn-primary", "btn-quiet");
}

// ------------------------------------------------------------------ latest PXL release
const size = (b) => (b >= 1e9 ? (b / 1e9).toFixed(1) + " GB" : Math.round(b / 1e6) + " MB");
fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } })
  .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
  .then((rel) => {
    const v = (rel.tag_name || "").replace(/^v/, "");
    if (v) $$("[data-version]").forEach((el) => (el.textContent = (el.closest(".mono") ? "v" : "Version ") + v));
    const notes = $("[data-notes]");
    if (notes && rel.html_url) notes.href = rel.html_url;
    const assets = rel.assets || [];
    for (const a of assets) {
      if (a.name === "PXL-mac.zip") $$('[data-size="mac"]').forEach((el) => (el.textContent = size(a.size)));
      if (a.name === "PXL-windows.zip") $$('[data-size="windows"]').forEach((el) => (el.textContent = size(a.size)));
    }
    // A release can go out before its Windows build finishes: point Windows buttons at the
    // release page instead of a file that isn't there yet.
    if (!assets.some((a) => a.name === "PXL-windows.zip")) {
      const page = rel.html_url || `https://github.com/${REPO}/releases/latest`;
      $$('[data-dl="windows"]').forEach((el) => {
        el.href = page;
        el.lastChild.textContent = "";
        el.querySelector(".sub").textContent = "";
        el.childNodes.forEach((n) => { if (n.nodeType === 3) n.textContent = ""; });
        el.insertAdjacentText("beforeend", "Windows build on the way");
      });
      if (isWin) setBtn(main, "#windows", "Windows build on the way", page);
    }
  })
  .catch(() => { /* the static links still work */ });

// ------------------------------------------------------------------ apps, from apps.json
const OUT = '<svg><use href="#out"/></svg>';
function mark(m = {}) {
  if (m.glyph === "wipe") return `<span class="mk"><span class="lutw"><span>${esc(m.text)}</span><span class="lime" aria-hidden="true">${esc(m.text)}</span><i class="gbar"></i></span></span>`;
  const g = m.glyph === "arrow" ? '<svg class="arrow"><use href="#arrow"/></svg>' : m.glyph === "strike" ? '<i class="strike"></i>' : m.glyph === "pixel" ? '<i class="px"></i>' : m.glyph === "go" ? '<i class="go"></i>' : "";
  return `<span class="mk">${esc(m.text)}${g}</span>`;
}
function appCard(a, newest) {
  const plats = Object.keys(a.platforms || {}).map((p) => (p === "mac" ? "macOS" : p === "windows" ? "Windows" : p)).join(" · ");
  const site = a.site && !a.site.includes("github.com") ? `<a href="${esc(a.site)}">Website ${OUT}</a>` : "";
  return `<article class="app reveal in" data-app="${esc(a.id)}">
    <div class="tile">${a.icon ? `<img src="${esc(a.icon)}" alt="">` : mark(a.mark)}</div>
    <div class="app-body">
      <div class="app-head"><h3>${esc(a.name)}</h3>${a.id === newest ? '<span class="badge">New</span>' : ""}<span class="tagc">${esc(a.category)}</span></div>
      <p class="app-tag">${esc(a.tagline)}</p>
      <p class="app-desc">${esc(a.description)}</p>
      <div class="app-links">${site}<a href="https://github.com/${esc(a.repo)}">GitHub ${OUT}</a><span class="plat">${esc(plats)}</span></div>
    </div>
  </article>`;
}
fetch(REGISTRY, { cache: "no-cache" })
  .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
  .then((reg) => {
    const apps = (reg.apps || []).slice().sort((x, y) => String(x.added).localeCompare(String(y.added)));
    if (!apps.length) return;
    const newest = apps[apps.length - 1];
    $("#app-list").innerHTML = apps.map((a) => appCard(a, newest.id)).join("");
    fitMarks();
    const pill = $("[data-newest]");
    if (pill) pill.innerHTML = `<span class="dot"></span><b>New</b> ${esc(newest.name)} joins PXL<span class="pill-more">: ${esc(newest.tagline.replace(/\.$/, "").toLowerCase())}</span>`;
  })
  .catch(() => { /* keep the built-in list */ });

// ------------------------------------------------------------------ pixel icons
// 8×8 bitmaps, drawn as SVG squares with a hairline gap so every pixel reads.
const PX = {
  bolt:    ["....##..", "...##...", "..##....", ".######.", "....##..", "...##...", "..##....", ".##....."],
  spark:   ["...#....", "..###...", ".#####..", "..###...", "...#....", "......#.", ".....###", "......#."],
  refresh: ["..####..", ".#....##", "#....###", "#.......", "#.......", "###....#", "##....#.", "..####.."],
  check:   ["........", ".......#", "......##", "#....##.", "##..##..", ".####...", "..##....", "........"],
  screens: ["########", "#......#", "#......#", "#......#", "########", "...##...", "..####..", "........"],
  user:    ["..####..", ".######.", ".######.", "..####..", "........", ".######.", "########", "########"],
  server:  ["########", "#.#....#", "########", "........", "########", "#.#....#", "########", "........"],
  eye:     ["........", "..####..", ".#....#.", "#..##..#", "#..##..#", ".#....#.", "..####..", "........"],
};
$$("[data-px]").forEach((el) => {
  const rows = PX[el.dataset.px];
  if (!rows) return;
  let rects = "";
  rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === "#") rects += `<rect x="${x + 0.06}" y="${y + 0.06}" width=".88" height=".88"/>`; }));
  el.innerHTML = `<svg viewBox="0 0 8 8" fill="currentColor" aria-hidden="true">${rects}</svg>`;
});

// ------------------------------------------------------------------ logo fitting
// Each logo is sized by its width (capped at Tag's size), like the app icons. Small
// tiles get relatively more breathing room.
function fitMarks() {
  $$(".tile > .mk").forEach((m) => {
    const t = m.parentElement.clientWidth;
    m.style.fontSize = "100px";
    const w = m.getBoundingClientRect().width;
    const target = t <= 34 ? 0.5 : t <= 50 ? 0.56 : 0.62;
    if (t && w) m.style.fontSize = Math.min(t * 0.34, (t * target * 100) / w).toFixed(2) + "px";
  });
}
fitMarks();
(document.fonts ? document.fonts.ready : Promise.resolve()).then(fitMarks);
addEventListener("resize", fitMarks);

// ------------------------------------------------------------------ screenshot switch
const sw = $(".switch");
const thumb = $(".thumb", sw);
const tabs = $$("button", sw);
const shots = $$(".window img[data-shot]");
const caption = $("[data-caption]");
const captions = {
  discover: "Every app, with what's new and one button to get it.",
  detail: "Screenshots, release notes and where it's installed. Open, update or remove it.",
  updates: "Updates for every app, and for PXL itself. Or let them install on their own.",
  welcome: "A short tour on first launch, then pick your first apps.",
};
const place = (btn) => {
  thumb.style.width = btn.offsetWidth + "px";
  thumb.style.transform = `translateX(${btn.offsetLeft - 3}px)`;
};
const select = (btn) => {
  tabs.forEach((t) => t.setAttribute("aria-selected", String(t === btn)));
  shots.forEach((img) => (img.hidden = img.dataset.shot !== btn.dataset.shot));
  caption.textContent = captions[btn.dataset.shot] || "";
  place(btn);
};
tabs.forEach((t) => t.addEventListener("click", () => select(t)));
place(tabs[0]);
addEventListener("resize", () => place($('[aria-selected="true"]', sw)));
document.fonts && document.fonts.ready.then(() => place($('[aria-selected="true"]', sw)));

// ------------------------------------------------------------------ hero pixels
// The same wave as PXL's splash screen: it ripples out from the pixel as it lands,
// then the field settles into a slow shimmer.
(function heroPixels() {
  const c = $(".hero-pixels");
  if (!c) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = c.getContext("2d");
  const S = 12;
  let W = 0, H = 0, cells = [], ox = 0, oy = 0, t0 = 0, visible = true;
  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = c.clientWidth; H = c.clientHeight;
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const px = $(".hero-mark .px").getBoundingClientRect(), box = c.getBoundingClientRect();
    ox = px.left - box.left + px.width / 2; oy = px.top - box.top + px.height / 2;
    cells = [];
    for (let y = 0; y < H / S; y++) for (let x = 0; x < W / S; x++) {
      if (Math.random() < .5) {
        const d = Math.hypot(x * S - ox, y * S - oy);
        // q: how much idle shimmer a cell may show, low in an ellipse around the copy.
        const q = Math.min(1, Math.hypot((x * S - W / 2) / (W * .38), (y * S - oy - 90) / 230) ** 2);
        cells.push({ x, y, d, q, r: Math.random(), p: Math.random() * 6.28 });
      }
    }
  };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) requestAnimationFrame(tick); }).observe(c);
  const tick = (now) => {
    if (!t0) t0 = now;
    const t = (now - t0) / 1000 - 1.0; // starts as the pixel lands
    ctx.clearRect(0, 0, W, H);
    const wave = t * 620 - 60;
    for (const k of cells) {
      const ring = t > 0 ? Math.exp(-((k.d - wave) ** 2) / 5000) * (0.3 + k.r * .35) * Math.max(0, 1 - k.d / 1100) : 0;
      // After the wave: a faint shimmer, nearly gone behind the mark and the line of text.
      const idle = t > 1.2 ? Math.max(0, Math.sin(k.p + now / 1000 * (.25 + k.r * .5))) ** 10 * 0.055 * k.q * Math.min(1, (t - 1.2)) : 0;
      const a = Math.max(ring, idle);
      if (a < .02) continue;
      ctx.fillStyle = `rgba(204,255,77,${a.toFixed(3)})`;
      ctx.fillRect(k.x * S, k.y * S, S - 3, S - 3);
    }
    if (visible && !reduce) requestAnimationFrame(tick);
  };
  addEventListener("resize", size);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { size(); if (!reduce) requestAnimationFrame(tick); });
})();

// ------------------------------------------------------------------ reveals
const items = $$(".reveal");
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
items.forEach((el, i) => { el.style.transitionDelay = (i % 3) * 60 + "ms"; io.observe(el); });
