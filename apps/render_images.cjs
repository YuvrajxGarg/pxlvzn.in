// Renders each app site's icon.png, apple-touch-icon.png and og.png (the link preview)
// from HTML, with the same wordmark and glyph the sites use. Run after build.py:
//
//     node apps/render_images.cjs        (needs Playwright and the Inter font)
//
// The app repos may ship their own icons later; drop a 512px icon.png into
// apps/<id>/assets/ to replace the rendered one.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const HERE = __dirname;
const CSS = fs.readFileSync(path.join(HERE, "_shared", "style.css"), "utf8");
const APPS = {
  tag: { mark: '<span class="tagw" style="--knock:#1f1f21">tag<i class="strike"></i></span>', tagline: "Take the AI tags off your photos and videos." },
  stm: { glyph: '<i class="g g-stems"></i>', tagline: "Split any song into its stems." },
  lut: { mark: '<span class="lutw" style="--knock:#1f1f21"><span class="base">lut</span><span class="lime">lut</span><i class="gbar"></i></span>', tagline: "Match the colour of one shot to another." },
  hop: { mark: '<span class="hopw">hop<i class="go"></i></span>', tagline: "Send files between your devices. No cloud." },
  // Syn uses the outlined brand mark (apps/_shared/syn/mark.svg) rather than live text.
  pin: { mark: '<span class="pinw">p<span class="mi"><span class="c"><b></b><b></b><b></b></span><span class="c"><b></b><b></b><b></b></span><span class="c"><b></b><b></b></span></span>n</span>', tagline: "Your Pinterest feed, as a screensaver." },
  syn: { mark: `<img class="synmark" src="data:image/svg+xml;base64,${fs.readFileSync(path.join(__dirname, "_shared", "syn", "mark.svg")).toString("base64")}">`, tagline: "Sync every camera and mic by sound." },
};

const page = (body, w, h) => `<!doctype html><html><head><style>${CSS}
  :root { --display: "Inter", system-ui, sans-serif; --font: "Inter", system-ui, sans-serif; }
  html, body { margin: 0; width: ${w}px; height: ${h}px; overflow: hidden; }
  body { background: transparent; display: grid; place-items: center; }
  .tile { width: 82%; height: 82%; border-radius: 22.5%; display: grid; place-items: center;
    background: linear-gradient(#2b2b2d, #121213); border: 2px solid rgba(255,255,255,.12);
    box-shadow: inset 0 2px 0 rgba(255,255,255,.06); }
  .tile.full { width: 100%; height: 100%; border-radius: 0; border: 0; }
  .og { width: 100%; height: 100%; background: radial-gradient(700px 380px at 50% 18%, rgba(204,255,77,.14), transparent 70%), #0b0b0c;
    display: grid; place-content: center; justify-items: center; gap: 34px; text-align: center; }
  .og h1 { max-width: 20ch; font-size: 64px; }
  .og small { font: 600 22px/1 var(--font); color: rgba(255,255,255,.45); letter-spacing: .02em; }
  .wordmark { color: #fff; }
</style></head><body>${body}</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  for (const [id, a] of Object.entries(APPS)) {
    if (process.argv[2] && !process.argv.slice(2).includes(id)) continue;
    const dir = path.join(HERE, id, "assets");
    const mark = (px) => `<span class="wordmark" style="font-size:${px}px">${a.mark || id + a.glyph}</span>`;

    await p.setViewportSize({ width: 512, height: 512 });
    await p.setContent(page(`<div class="tile">${mark(150)}</div>`, 512, 512));
    await p.screenshot({ path: path.join(dir, "icon.png"), omitBackground: true });

    await p.setViewportSize({ width: 180, height: 180 });
    await p.setContent(page(`<div class="tile full">${mark(56)}</div>`, 180, 180));
    await p.screenshot({ path: path.join(dir, "apple-touch-icon.png") });

    await p.setViewportSize({ width: 1200, height: 630 });
    await p.setContent(page(`<div class="og">${mark(150)}<h1>${a.tagline}</h1><small>${id}.pxlvzn.in · Free for Mac and Windows</small></div>`, 1200, 630));
    await p.screenshot({ path: path.join(dir, "og.png") });
    console.log("rendered", id);
  }
  await browser.close();
})();
