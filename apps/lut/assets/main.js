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
  // Asset names follow Dwn and Tag (Name-mac.zip, Name-windows.zip or Name-Setup-x.exe),
  // matched loosely so a renamed build still gets picked up.
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
      const mac = pick(/mac.*\.(zip|dmg)$/i) || pick(/\.dmg$/i);
      const win = pick(/setup.*\.exe$/i) || pick(/win.*\.(zip|exe|msi)$/i) || pick(/\.(exe|msi)$/i);
      const wire = (key, a) => {
        const href = a ? a.browser_download_url : rel.html_url || `${releases}/latest`;
        $$(`[data-dl="${key}"]`).forEach((el) => (el.href = href));
        if (a) $$(`[data-size="${key}"]`).forEach((el) => (el.textContent = size(a.size)));
        return href;
      };
      const macHref = wire("mac", mac), winHref = wire("windows", win);
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
