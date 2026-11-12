"""Builds the websites for the newer PXLVZN apps, one static site per subdomain:

    tag.pxlvzn.in   apps/tag/
    stm.pxlvzn.in   apps/stm/
    lut.pxlvzn.in   apps/lut/
    hop.pxlvzn.in   apps/hop/
    syn.pxlvzn.in   apps/syn/
    pin.pxlvzn.in   apps/pin/

    python3 apps/build.py

Every site shares one page layout (below), apps/_shared/style.css and
apps/_shared/main.js, so they look like dwn.pxlvzn.in and each other. The copy for
each app lives in APPS. Each apps/<id>/ folder is a Vercel project's root directory,
and is committed, so Vercel deploys it as plain files with no build step.
"""

import html
import pathlib
import json
import shutil

HERE = pathlib.Path(__file__).resolve().parent
SHARED = HERE / "_shared"
ASSET_VERSION = "8"  # bump to make browsers refetch style.css and main.js

GLYPHS = {
    "stems": '<i class="g g-stems" aria-hidden="true"></i>',
    "strike": "",
    "cube": "",
    "hop": "",
    "sync": "",
    "pin": "",
}

ICONS = """<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="apple" viewBox="0 0 24 24"><path fill="currentColor" d="M16.37 12.6c.02 2.6 2.28 3.46 2.3 3.47-.02.06-.36 1.24-1.19 2.45-.72 1.05-1.46 2.09-2.63 2.11-1.15.02-1.52-.68-2.83-.68-1.32 0-1.73.66-2.82.7-1.13.04-1.99-1.13-2.71-2.18-1.48-2.13-2.61-6.03-1.09-8.66.75-1.31 2.1-2.13 3.56-2.15 1.11-.02 2.16.75 2.83.75.68 0 1.95-.93 3.29-.79.56.02 2.13.23 3.14 1.7-.08.05-1.87 1.1-1.85 3.28M14.2 5.2c.6-.73 1-1.73.89-2.74-.86.04-1.9.58-2.52 1.3-.55.64-1.04 1.66-.91 2.64.96.07 1.94-.49 2.54-1.2"/></symbol>
  <symbol id="windows" viewBox="0 0 24 24"><path fill="currentColor" d="M3 5.1 10.4 4v7.2H3zm8.3-1.2L21 2.5v8.7h-9.7zM3 12.2h7.4v7.2L3 18.3zm8.3 0H21v8.7l-9.7-1.4z"/></symbol>
  <symbol id="github" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2"/></symbol>
  <symbol id="down" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M12 4v13m0 0-5.5-5.5M12 17l5.5-5.5M5 20h14"/></symbol>
  <symbol id="check" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" d="m5 12.5 4.5 4.5L19 7.5"/></symbol>
  <symbol id="file" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></g></symbol>
  <symbol id="music" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></g></symbol>
  <symbol id="bolt" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M13 3 5 14h6l-1 7 8-11h-6z"/></symbol>
  <symbol id="lock" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></g></symbol>
  <symbol id="term" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 7 5 5-5 5M12 17h7"/></g></symbol>
  <symbol id="layers" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/></g></symbol>
  <symbol id="cube" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/></g></symbol>
  <symbol id="eye" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></g></symbol>
  <symbol id="wifi" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r=".6"/></g></symbol>
  <symbol id="qr" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v7h-4M14 18v3"/></g></symbol>
  <symbol id="resume" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/></g></symbol>
</svg>"""

PAGE = """<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{name} — {tagline_plain}</title>
<meta name="description" content="{description}">
<meta name="theme-color" content="#0b0b0c">
<link rel="canonical" href="https://{id}.pxlvzn.in/">
<link rel="icon" type="image/png" href="/assets/icon.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:url" content="https://{id}.pxlvzn.in/">
<meta property="og:title" content="{name} — {tagline_plain}">
<meta property="og:description" content="{og}">
<meta property="og:image" content="https://{id}.pxlvzn.in/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..900&family=Inter+Tight:wght@100..900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css?v={v}">
<script>document.documentElement.classList.replace("no-js", "js-anim")</script>
</head>
<body data-repo="YuvrajxGarg/{id}">

{icons}

<header class="nav" id="nav">
  <div class="wrap">
    <a href="/" class="wordmark" aria-label="{name} home">{mark}</a>
    <nav class="nav-links" aria-label="Sections">
      <a href="#features">Features</a>
      <a href="#how">How it works</a>
      <a href="#private">Privacy</a>
    </nav>
    <div class="nav-right">
      <a class="icon-link" href="https://github.com/YuvrajxGarg/{id}" aria-label="{name} on GitHub"><svg><use href="#github"/></svg></a>
      <a class="btn btn-primary btn-sm" href="#download"><svg><use href="#down"/></svg>Download</a>
    </div>
  </div>
</header>

<main>
  <section class="hero">
    <div class="wrap">
      <a class="pill" href="https://pxlvzn.in"><span class="dot"></span><b>New</b> in the PXL suite</a>

      {hero_mark}

      <h1 class="tagline">{tagline_html}</h1>
      <p class="lede">{lede}</p>

      <div class="cta">
        <a class="btn btn-primary btn-lg" id="cta-main" href="#download">
          <svg><use href="#apple"/></svg><span>Download for Mac</span>
        </a>
        <a class="btn btn-quiet btn-lg" id="cta-alt" href="#download">
          <svg><use href="#windows"/></svg><span>Windows</span>
        </a>
      </div>
      <p class="meta"><span class="not-soon" data-version>Latest version</span><span class="soon">First release coming soon</span> · Free and <a href="https://github.com/YuvrajxGarg/{id}">open source</a> · {os_line}</p>

      <div class="showcase">
        <div class="demo" role="img" aria-label="{demo_label}">
{demo}
        </div>
        <p class="caption">{caption}</p>
      </div>
    </div>
  </section>

  <section class="block" id="features">
    <div class="wrap">
      <div class="reveal">
        <div class="kicker">Features</div>
        <h2>{features_title}</h2>
        <p class="section-lede">{features_lede}</p>
      </div>
      <div class="bento">
{cards}
      </div>
    </div>
  </section>

  <section class="block" id="how">
    <div class="wrap">
      <div class="reveal">
        <div class="kicker">How it works</div>
        <h2>{how_title}</h2>
        <p class="section-lede">{how_lede}</p>
      </div>
      <div class="steps3">
{steps}
      </div>
    </div>
  </section>

  <section class="block" id="private">
    <div class="wrap">
      <div class="reveal">
        <div class="kicker">Private by design</div>
        <h2>It runs on your computer. <span class="thin">That's it.</span></h2>
        <p class="section-lede">{private_lede}</p>
      </div>
      <div class="trio">
        <div class="card reveal"><div class="big">0<span>.</span></div><h3>Accounts</h3><p>No sign-up, no email. Open it and go.</p></div>
        <div class="card reveal"><div class="big">0<span>.</span></div><h3>Servers</h3><p>{servers_line}</p></div>
        <div class="card reveal"><div class="big">0<span>.</span></div><h3>Trackers</h3><p>No analytics, no crash reporting, no ads. Ever.</p></div>
      </div>
    </div>
  </section>

  <section class="download" id="download">
    <div class="wrap">
      <div class="download-box reveal">
        <div class="kicker">Download</div>
        <h2>Get {name}. <span class="thin">It's free.</span></h2>
        <p class="section-lede" style="margin-inline:auto"><span class="not-soon"><span data-version>The latest version</span>. It checks for updates and installs them with one click.</span><span class="soon">The first release is on its way. Watch the <a href="https://github.com/YuvrajxGarg/{id}" style="color:var(--text);border-bottom:1px solid rgba(204,255,77,.55)">GitHub repo</a> or get it through PXL when it lands.</span></p>
        <div class="platforms">
          <div class="platform" data-platform="mac">
            <header><svg><use href="#apple"/></svg><div><h3>macOS</h3><small>{mac_req}</small></div></header>
            <a class="btn btn-primary" data-dl="mac" href="{mac_url}"><svg><use href="#down"/></svg><span class="not-soon">Download for Mac</span><span class="soon">Coming soon</span> <span class="sub" data-size="mac"></span></a>
            <p class="note" data-note="mac">{mac_note}</p>
          </div>
          <div class="platform" data-platform="windows">
            <header><svg><use href="#windows"/></svg><div><h3>Windows</h3><small>Windows 10 or 11 · 64-bit</small></div></header>
            <a class="btn btn-quiet" data-dl="windows" href="{win_url}"><svg><use href="#down"/></svg><span class="not-soon">Download for Windows</span><span class="soon">Coming soon</span> <span class="sub" data-size="windows"></span></a>
            <p class="note" data-note="windows">{win_note}</p>
          </div>
        </div>
        <div class="pxl-note">
          <span class="pm">pxl<i></i></span>
          <p>{name} is part of <a href="https://pxlvzn.in">PXL</a>, the free app that installs, opens and updates every PXLVZN app, including <a href="https://dwn.pxlvzn.in">Dwn</a>, <a href="https://tag.pxlvzn.in">Tag</a>, Stm, Lut, Hop, Syn and Pin. Already have PXL? {name} shows up in its app list once it is released.</p>
        </div>
        <p class="meta" style="margin-top:26px"><a href="https://github.com/YuvrajxGarg/{id}/releases" data-notes>Release notes</a> · <a href="https://github.com/YuvrajxGarg/{id}">Source code</a></p>
      </div>
    </div>
  </section>
</main>

<footer>
  <div class="wrap">
    <a href="/" class="wordmark" aria-label="{name} home">{mark}</a>
    <nav aria-label="Footer">
      <a href="https://pxlvzn.in">PXL</a>
      <a href="https://github.com/YuvrajxGarg/{id}">GitHub</a>
      <a href="https://github.com/YuvrajxGarg/{id}/releases">Releases</a>
      <a href="https://github.com/YuvrajxGarg/{id}/issues">Support</a>
    </nav>
    <div class="fine">
      <span>© 2026 Yuvraj Garg. MIT licensed.</span>
      <span>{fine}</span>
    </div>
  </div>
</footer>

<script src="/assets/main.js?v={v}" defer></script>
</body>
</html>
"""

NOT_FOUND = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found — {name}</title>
<meta name="theme-color" content="#0b0b0c">
<link rel="icon" type="image/png" href="/assets/icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..900&family=Inter+Tight:wght@100..900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css?v={v}">
</head>
<body>
<header class="nav scrolled">
  <div class="wrap">
    <a href="/" class="wordmark" aria-label="{name} home">{mark}</a>
    <div class="nav-right"><a class="btn btn-primary btn-sm" href="/#download">Download</a></div>
  </div>
</header>
<main class="doc" style="text-align:center;padding:120px 0 40px">
  <div class="wrap">
    <div class="kicker">404</div>
    <h2 style="margin:12px auto 0">This page isn't here.</h2>
    <p class="section-lede" style="margin:16px auto 0">The link might be old, or mistyped.</p>
    <p style="margin-top:30px"><a class="btn btn-primary" href="/">Go to {name}</a></p>
  </div>
</main>
</body>
</html>
"""

VERCEL = """{
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    { "source": "/assets/(.*)\\\\.(png|jpg|svg|ico)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=86400" }] },
    { "source": "/assets/(.*)\\\\.(css|js)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }] },
    { "source": "/(.*)", "headers": [
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
    ] }
  ]
}
"""


def card(span, icon, title, body, extra="", lime=False):
    ico = f'<div class="ico{" lime" if lime else ""}"><svg><use href="#{icon}"/></svg></div>' if icon else ""
    return (f'        <article class="card {span} reveal">\n          {ico}\n          <h3>{title}</h3>\n'
            f'          <p>{body}</p>{extra}\n        </article>')


def step(title, body):
    return f'        <div class="card reveal"><h3>{title}</h3><p>{body}</p></div>'


def wave(seed, n=72):
    # Deterministic pseudo-random bar heights so the build is reproducible.
    out, x = [], seed
    for i in range(n):
        x = (x * 1103515245 + 12345) & 0x7FFFFFFF
        h = 18 + (x % 70)
        out.append(f'<i style="--h:{h};--d:{(i % 9) / 6:.2f}"></i>')
    return "".join(out)


# ------------------------------------------------------------------------- Tag
# Tag has a real UI, so its hero shows the app's own screenshots (from the tag repo's docs/,
# cropped to the window): the scan, then the same batch cleaned, every tag struck through.
TAG_DEMO = """          <div class="shots">
            <img src="/assets/scan.jpg" width="1536" height="949" alt="">
            <img class="after" src="/assets/clean.jpg" width="1536" height="949" alt="" loading="lazy">
            <span class="tag l">Scanned</span><span class="tag r">Cleaned</span>
          </div>"""

# ------------------------------------------------------------------------- Stm
STM_DEMO = f"""          <div class="bar"><i></i><i></i><i></i><span>Stm</span><span class="r">htdemucs · CoreML</span></div>
          <div class="body">
            <div class="drop"><span class="file"><svg><use href="#music"/></svg></span><div><b>Late Night Drive.flac</b><small>3:42 · 44.1 kHz · split in 38 s</small></div><span class="go btn btn-primary btn-sm">Show stems</span></div>
            <div class="lanes">
              <div class="lane on"><div><b>Vocals</b><small>vocals.wav</small></div><div class="wave">{wave(7)}</div><span class="solo">S</span></div>
              <div class="lane"><div><b>Drums</b><small>drums.wav</small></div><div class="wave">{wave(23)}</div><span class="solo">S</span></div>
              <div class="lane"><div><b>Bass</b><small>bass.wav</small></div><div class="wave">{wave(41)}</div><span class="solo">S</span></div>
              <div class="lane"><div><b>Other</b><small>other.wav</small></div><div class="wave">{wave(59)}</div><span class="solo">S</span></div>
            </div>
          </div>"""

# ------------------------------------------------------------------------- Lut
LUT_SCENE = '<div class="sky"></div><div class="sun"></div><div class="hill"></div><div class="hill b"></div><div class="ground"></div>'
LUT_DEMO = f"""          <div class="bar"><i></i><i></i><i></i><span>Lut</span><span class="r">OKLab · 33³</span></div>
          <div class="body">
            <div class="grade">
              <div class="scene before">{LUT_SCENE}</div>
              <div class="after-clip"><div class="scene after">{LUT_SCENE}</div></div>
              <div class="handle"></div>
              <span class="tag l">Your clip</span><span class="tag r">Matched</span>
            </div>
            <div class="swatches">
              <div class="swatch"><span class="chipset"><i style="background:#253a6b"></i><i style="background:#e9925a"></i><i style="background:#3d3550"></i></span><div><b>Reference</b><code>golden-hour.jpg</code></div></div>
              <span class="arrow-r">→</span>
              <div class="swatch"><span class="chipset"><i style="background:#ccff4d"></i><i style="background:#4dd8ff"></i><i style="background:#ffb35c"></i></span><div><b>Your LUT</b><code>A001_match.cube</code></div></div>
            </div>
          </div>"""

# ------------------------------------------------------------------------- Hop
HOP_DEMO = """          <div class="bar"><i></i><i></i><i></i><span>Hop</span><span class="r">Home Wi-Fi · 3 devices</span></div>
          <div class="body">
            <div class="devices">
              <div class="arc"><svg viewBox="0 0 100 120" preserveAspectRatio="none"><path d="M0,110 Q50,-40 100,110"/></svg></div>
              <div class="hopper"><i></i></div>
              <div class="device mac on"><div class="shape">Mac</div><b>Studio MacBook</b><small>Sending</small></div>
              <div class="device win"><div class="shape">PC</div><b>Edit PC</b><small>Paired</small></div>
              <div class="device phone on"><div class="shape">▢</div><b>iPhone</b><small>In the browser</small></div>
            </div>
            <div class="transfer"><div><b>Day 2 selects/</b> <small>· 14 files · 6.8 GB · 112 MB/s</small></div><span class="code6" aria-label="Pairing code 482 913"><span>4</span><span>8</span><span>2</span><span>9</span><span>1</span><span>3</span></span><div class="meter"><i></i></div></div>
          </div>"""

# ------------------------------------------------------------------------- Syn
# A multicam timeline: eight tracks arrive out of step, Syn lines them up on the clap (the lime
# line), and each clip gets its confidence score. The rest of a 20-track shoot is folded into one
# row, the way the app groups tracks so a big shoot still fits on screen.
SYN_TRACKS = [
    # name, source, kind, left %, width %, start offset %, confidence
    ("A cam", "FX3 · A001.mov", "v", 4, 90, 9, 99),
    ("B cam", "A7S III · C0042.mp4", "v", 10, 84, -8, 98),
    ("C cam", "GoPro · GX010118.mp4", "v", 0, 96, 6, 94),
    ("Drone", "Mini 4 · DJI_0187.mp4", "v", 22, 52, -13, 87),
    ("Recorder", "Zoom F6 · mix.wav", "a", 2, 97, -5, 99),
    ("Lav, host", "Tr1.wav", "a", 6, 88, 10, 97),
    ("Lav, guest", "Tr2.wav", "a", 6, 88, 13, 96),
    ("Phone", "BTS · IMG_4410.mov", "v", 30, 40, -16, 71),
]
SYNC_AT = 38  # where the clap lands once everything is lined up, in % of the timeline


def syn_wave(seed, spike, n):
    # Bars for one clip, with the clap as a tall spike at `spike` (0..1 across the clip).
    out, x, at, env = [], seed, round(spike * (n - 1)), 55
    for i in range(n):
        x = (x * 1103515245 + 12345) & 0x7FFFFFFF
        env = min(85, max(28, env + (x % 25) - 12))  # a slowly wandering loudness
        h = 100 if i == at else 80 if abs(i - at) == 1 else round(env * (0.45 + (x >> 8) % 56 / 100))
        out.append(f'<i style="--h:{h}"{" class=k" if abs(i - at) <= 1 else ""}></i>')
    return "".join(out)


def syn_lane(i, t):
    name, src, kind, left, width, off, conf = t
    level = "hi" if conf >= 90 else "mid" if conf >= 80 else "lo"
    label = "Check" if conf < 80 else f"{conf}%"
    return (f'              <div class="trk {kind}" style="--i:{i}">'
            f'<div class="th"><b>{name}</b><small>{src}</small></div>'
            f'<div class="lanebg"><div class="clip" style="left:{left}%;width:{width}%;--off:{off * 100 / width:.1f}%">'
            f'<div class="cw">{syn_wave(17 + i * 13, (SYNC_AT - left) / width, round(width * 0.9))}</div></div></div>'
            f'<span class="conf {level}" title="Sync confidence">{label}</span></div>')


SYN_DEMO = (f"""          <div class="bar"><i></i><i></i><i></i><span>Syn</span><span class="r">Interview_Day2.xml · 20 tracks</span></div>
          <div class="body syn-tl">
            <div class="status"><span class="spin" aria-hidden="true"></span>
              <span class="s1">Listening to 20 tracks…</span><span class="s2"><b>19 synced</b> · 1 to check · 95% average confidence</span>
              <span class="go btn btn-primary btn-sm">Send to Premiere</span></div>
            <div class="ruler"><span>00:00</span><span>00:30</span><span>01:00</span><span>01:30</span><span>02:00</span></div>
            <div class="tracks" style="--sync:{SYNC_AT / 100}">
              <i class="syncline" aria-hidden="true"></i>
"""
    + "\n".join(syn_lane(i, t) for i, t in enumerate(SYN_TRACKS))
    + """
              <div class="trk more"><div class="th"><b>+12 tracks</b><small>4 cameras · 8 audio</small></div><div class="lanebg"><div class="stack"><i></i><i></i><i></i></div></div><span class="conf hi">96%</span></div>
            </div>
          </div>""")

# ------------------------------------------------------------------------- Pin
# The screensaver itself: masonry columns of pins drifting upward at slightly different
# speeds, a clock in the corner. One pin gets hidden mid-scroll (it folds away), the way
# hiding a pin in the app takes it out of the screensaver.
PIN_PALETTE = [("#3a2f5c", "#c06c84"), ("#1f3b4d", "#5fb3b3"), ("#4a3b1f", "#e0a458"), ("#2b3a2b", "#8fbf6a"),
               ("#3d1f2b", "#e05a6b"), ("#232946", "#b8c1ec"), ("#1b262c", "#3282b8"), ("#2d2424", "#e0c097"),
               ("#2a1f3d", "#9d7bd8"), ("#123", "#5f9ea0"), ("#3b2a20", "#d9a066"), ("#202a25", "#a3c9a8")]
PIN_RATIOS = [1.5, 1.2, 1.78, 1.0, 1.33, 2.0, 0.8, 1.6, 1.25, 1.4, 1.1, 1.7]
PIN_SHAPES = ["circle", "arch", "bars", "sun", "blob", "lines"]


def pin_tile(n, hide=False):
    a, b = PIN_PALETTE[n % len(PIN_PALETTE)]
    r = PIN_RATIOS[(n * 7) % len(PIN_RATIOS)]
    shape = PIN_SHAPES[(n * 5) % len(PIN_SHAPES)]
    return (f'<div class="pt s-{shape}{" hide" if hide else ""}" style="--a:{a};--b:{b};--r:{r};--k:{n % 5}">'
            f'<i></i><b></b>{"<span class=pt-x>Hidden</span>" if hide else ""}</div>')


def pin_col(c, count, hide_at=None):
    tiles = "".join(pin_tile(c * 11 + j, j == hide_at) for j in range(count))
    # Each column holds its tiles twice so the upward loop is seamless.
    return f'<div class="pcol" style="--c:{c}"><div class="ptrack">{tiles}{tiles}</div></div>'


PIN_DEMO = ('''          <div class="bar"><i></i><i></i><i></i><span>Pin</span><span class="r">Screensaver · your home feed · 186 pins</span></div>
          <div class="body pin-wall">
''' + "\n".join("            " + pin_col(c, 6, 2 if c == 2 else None) for c in range(5)) + '''
            <div class="pclock"><b>9:41</b><small>Thursday 12 November</small></div>
          </div>''')

APPS = [
    dict(
        id="tag", name="Tag", glyph="strike",
        tagline="Take the AI tags off your photos and videos.",
        tagline_html='<span class="t-thin">Take the AI tags off</span> <span class="t-bold">your photos and videos.</span>',
        description="Tag is a free app for Mac and Windows that strips C2PA Content Credentials, made-with-AI labels and generator metadata from photos and videos. Lossless: nothing is re-encoded and your originals are never touched.",
        og="Strips C2PA, made-with-AI labels and generator metadata. Lossless, on your own computer. Free for Mac and Windows.",
        lede="AI tools stamp their output with metadata, and platforms read it. Used AI for one VFX pass, a cleanup or an extend? Tag removes those stamps from your photos and videos without touching a single pixel, on your own computer.",
        os_line="macOS and Windows",
        demo=TAG_DEMO, demo_label="Tag scanning five files and finding AI tags from Adobe Firefly, Higgsfield and C2PA, then the same batch cleaned with every tag struck through.",
        caption="Drop a batch. See every tag. Clean them all, losslessly.",
        features_title='Every tag found. <span class="thin">Every pixel kept.</span>',
        features_lede="Tag rewrites the file's wrapper, not its picture. What you made stays exactly as you made it.",
        cards=[
            card("span-3 wide", "eye", "Sees every tag", "C2PA Content Credentials, IPTC &ldquo;made with AI&rdquo; labels, XMP edit history and the generator stamps from the tools you use.", '<div class="chips" aria-label="Recognises"><span class="chip on">Higgsfield</span><span class="chip on">Firefly</span><span class="chip on">OpenAI</span><span class="chip on">Midjourney</span><span class="chip">Runway</span><span class="chip">Kling</span></div>', lime=True),
            card("span-3 wide", "check", "Lossless, bit for bit", "Images are rewritten at the container level and videos are remuxed with stream copy, so nothing is re-encoded. Colour profiles, orientation, transparency and HDR stay put."),
            card("span-2", "file", "Photos and videos", "JPG, PNG, WebP, MP4, MOV, MKV and WebM. Drop hundreds of files or a whole folder at once."),
            card("span-2", "layers", "Originals untouched", "Clean copies go to a cleaned folder beside each file, or anywhere you choose. The originals are never modified."),
            card("span-2", "term", "And a CLI", "Clean a whole export folder from a script.", '<div class="term"><span class="p">$</span> Tag clean ./exports</div>'),
        ],
        how_title='Drop, see, clean. <span class="thin">That&rsquo;s it.</span>',
        how_lede="No settings to learn. ffmpeg comes bundled, so there's nothing else to install.",
        steps=[step("Drop files", "Drag photos, videos or whole folders onto the window."),
               step("See the tags", "Each file lists what it carries: Firefly, Higgsfield, C2PA manifests, IPTC AI labels and more."),
               step("Clean", "Tag writes clean copies and strikes through every tag it removed.")],
        private_lede="Tag never uploads your files. It reads and rewrites them on your own machine, so unreleased work stays unreleased.",
        servers_line="Files are cleaned on your machine. They never leave it.",
        mac_req="macOS 11 or later · Apple silicon",
        mac_url="https://github.com/YuvrajxGarg/tag/releases/latest/download/Tag.dmg",
        win_url="https://github.com/YuvrajxGarg/tag/releases/latest/download/Tag-Setup.exe",
        mac_note="Open it and drag <b>Tag</b> to Applications. The first time, right-click it and choose <b>Open</b>.",
        win_note="Run the setup. It adds Tag to the Start menu. If SmartScreen appears, click <b>More info</b>, then <b>Run anyway</b>.",
        fine="Tag removes metadata, not watermarks hidden in the pixels such as SynthID. Disclose AI use where a platform asks you to.",
    ),
    dict(
        id="stm", name="Stm", glyph="stems",
        tagline="Split any song into its stems.",
        tagline_html='<span class="t-thin">Split any song</span> <span class="t-bold">into its stems.</span>',
        description="Stm is a free app for Mac and Windows that splits any song into vocals, drums, bass and everything else, on your own computer. No uploads, no accounts, no per-song credits.",
        og="Vocals, drums, bass and the rest, as separate files. On your own computer, free for Mac and Windows.",
        lede="Drop in a song and get vocals, drums, bass and everything else as separate files. Made for remixes, acapellas, karaoke and sampling, and it runs on your own computer, so nothing is uploaded and there are no per-song credits.",
        os_line="macOS and Windows",
        demo=STM_DEMO, demo_label="Stm splitting a song into four lanes: vocals, drums, bass and other.",
        caption="Drop a song. Get four files back.",
        features_title='Studio-grade stems. <span class="thin">No studio.</span>',
        features_lede="The same kind of model the paid stem sites run, on your own machine and your own GPU.",
        cards=[
            card("span-3 wide", "layers", "Four clean stems", "Vocals, drums, bass and other, each as its own lossless WAV, lined up sample for sample so they drop straight into a DAW.", '<div class="chips" aria-label="Stems"><span class="chip on">Vocals</span><span class="chip on">Drums</span><span class="chip on">Bass</span><span class="chip on">Other</span><span class="chip">Instrumental</span></div>', lime=True),
            card("span-3 wide", "bolt", "Fast on your own hardware", "Demucs (htdemucs) runs through ONNX Runtime, on the Neural Engine and GPU with CoreML on a Mac and DirectML on Windows. No Python to install, no cloud queue."),
            card("span-2", "music", "Any length", "Long mixes and DJ sets are split in overlapping chunks and blended back together, so memory stays flat and there are no seams."),
            card("span-2", "file", "Drop anything", "MP3, WAV, FLAC, M4A and the audio from video files. Drop a whole folder to split an album."),
            card("span-2", "term", "And a CLI", "Script it, batch it, put it in a pipeline.", '<div class="term"><span class="p">$</span> stm split song.mp3</div>'),
        ],
        how_title='Three steps. <span class="thin">No settings.</span>',
        how_lede="The defaults are the good ones. Open the advanced panel only if you want to.",
        steps=[step("Drop a song", "Drag a file or folder onto the window, or use the CLI."),
               step("Stm splits it", "The model runs locally, chunk by chunk, using your GPU when there is one."),
               step("Use the stems", "Four WAVs land in a folder next to the song, named and ready for your DAW.")],
        private_lede="Stm never uploads your music. The model ships with the app and runs offline, so unreleased tracks stay unreleased.",
        servers_line="The model runs on your machine. Your songs never leave it.",
        mac_req="Apple silicon",
        fine="Use Stm on music you have the right to use.",
    ),
    dict(
        id="lut", name="Lut", glyph="cube",
        tagline="Match the colour of one shot to another.",
        tagline_html='<span class="t-thin">Match the colour</span> <span class="t-bold">of one shot to another.</span>',
        description="Lut is a free app for Mac and Windows that matches the colour of your clip to any reference frame and gives you a .cube LUT plus a graded copy. Works with Resolve, Premiere and Final Cut.",
        og="Drop a reference frame and your clip. Get a .cube LUT and a graded copy. Free for Mac and Windows.",
        lede="Drop a reference frame and your clip. Lut works out the look and gives you a <code style=\"font:600 .9em ui-monospace,monospace;color:var(--text)\">.cube</code> LUT you can use in Resolve, Premiere or Final Cut, plus a graded copy of the clip. Great for making AI shots sit next to real footage.",
        os_line="macOS and Windows",
        demo=LUT_DEMO, demo_label="A landscape shot, half in flat grey colours and half matched to a warm golden-hour reference, with a draggable divider.",
        caption="Drag across the frame to compare. Your clip on the left, matched on the right.",
        features_title="A colourist's first pass. <span class=\"thin\">In a second.</span>",
        features_lede="Lut does the matching. You keep full control in the editor you already use.",
        cards=[
            card("span-3 wide", "cube", "A real .cube LUT", "A 33-point 3D LUT that loads in DaVinci Resolve, Premiere Pro, Final Cut Pro, After Effects and OBS. Apply it to one clip or the whole timeline.", '<div class="chips" aria-label="Works in"><span class="chip on">Resolve</span><span class="chip on">Premiere</span><span class="chip on">Final Cut</span><span class="chip">After Effects</span><span class="chip">OBS</span></div>', lime=True),
            card("span-3 wide", "eye", "Matching that looks right", "Colour is transferred in OKLab, a space built around how eyes see, so skin stays skin and highlights don't go muddy."),
            card("span-2", "file", "Photos or video", "Use a still, a frame grab or a whole clip as the reference. Match photos, video, or AI generations."),
            card("span-2", "layers", "A graded copy too", "Lut also writes the graded clip with ffmpeg, at full quality, beside the original. The original is never touched."),
            card("span-2", "term", "And a CLI", "Batch a folder of shots against one look.", '<div class="term"><span class="p">$</span> lut match ref.jpg clip.mov</div>'),
        ],
        how_title='Pick a look. <span class="thin">Get the LUT.</span>',
        how_lede="No nodes, no curves, no scopes, unless you want to take it further.",
        steps=[step("Drop a reference", "Any frame with the look you want: a film still, a photo, a hero shot."),
               step("Drop your clip", "Lut samples both and builds the colour transform between them."),
               step("Export", "Take the .cube into your editor, or use the graded copy as it is.")],
        private_lede="Lut has no servers. Your footage, references and LUTs stay on your machine.",
        servers_line="Everything is computed on your machine. Your footage never leaves it.",
        mac_req="Apple silicon",
        fine="The illustration above is drawn in CSS, not a real grade.",
    ),
    dict(
        id="hop", name="Hop", glyph="hop",
        tagline="Send files between your devices. No cloud.",
        tagline_html='<span class="t-thin">Send files between your devices.</span> <span class="t-bold">No cloud.</span>',
        description="Hop is a free app that sends files between your Mac, Windows PC and phone over your own Wi-Fi. Encrypted, resumable, full speed, with no cloud and no accounts. Phones use it in the browser.",
        og="AirDrop-style transfers between Mac, Windows and phones on your own Wi-Fi. Free, encrypted, no cloud.",
        lede="Like AirDrop, but between everything. Hop sends files and folders between your Mac, your Windows PC and your phone over your own Wi-Fi, at full speed, encrypted, and without going through anyone's cloud. Phones don't need an app at all.",
        os_line="macOS and Windows, phones in the browser",
        demo=HOP_DEMO, demo_label="A Mac sending a folder to a phone over Wi-Fi, with a Windows PC paired nearby and a six-digit pairing code.",
        caption="Your devices find each other. Drop a file on one and it hops to the other.",
        features_title='Fast and private. <span class="thin">It just finds things.</span>',
        features_lede="Your files go straight from one device to the other, over your own network.",
        cards=[
            card("span-3 wide", "wifi", "Finds your devices", "Hop discovers your other computers on the same Wi-Fi with Bonjour (mDNS). No IP addresses, no setup.", '<div class="chips" aria-label="Platforms"><span class="chip on">Mac</span><span class="chip on">Windows</span><span class="chip on">iPhone</span><span class="chip on">Android</span></div>', lime=True),
            card("span-3 wide", "lock", "Paired, then encrypted", "Pair two devices once with a 6-digit code. The handshake (SPAKE2) means someone else on the Wi-Fi can't guess or intercept it, and every transfer after that is end-to-end encrypted.", '<div class="keys" aria-label="Pairing code"><span class="key">4</span><span class="key">8</span><span class="key">2</span><span class="key">9</span><span class="key">1</span><span class="key">3</span></div>'),
            card("span-2", "qr", "Phones, no app", "Scan the QR code on your computer and Hop opens in your phone's browser. Send photos either way."),
            card("span-2", "resume", "Resumes, then verifies", "Big files go in chunks that pick up where they left off if the Wi-Fi drops, with a SHA-256 check at the end."),
            card("span-2", "term", "And a CLI", "Send from scripts, servers and SSH sessions.", '<div class="term"><span class="p">$</span> hop send ./renders</div>'),
        ],
        how_title='Open it on both. <span class="thin">Drop a file.</span>',
        how_lede="There's nothing to sign in to and nothing to configure.",
        steps=[step("Open Hop", "On both computers, or scan the QR code with your phone."),
               step("Pair once", "Type the 6-digit code. After that, your devices trust each other."),
               step("Drop and go", "Drag files or folders onto a device. They arrive at full Wi-Fi speed.")],
        private_lede="Hop is the cloud you don't need. Files go straight between your devices over your own network, encrypted, and never touch a server.",
        servers_line="Transfers go device to device on your network. Nothing passes through the internet.",
        mac_req="Apple silicon",
        fine="Hop works between devices on the same local network.",
    ),
    dict(
        id="syn", name="Syn", glyph="sync",
        tagline="Sync every camera and mic by sound.",
        tagline_html='<span class="t-thin">Sync every camera and mic</span> <span class="t-bold">by sound, in one go.</span>',
        description="Syn is a free app for Mac and Windows that syncs multicam footage and separate audio by sound. Send a sequence from Premiere Pro or drop in an XML, and get back a synced timeline with a confidence score on every clip.",
        og="Multicam and dual-system audio, synced by sound, with a confidence score on every clip. Premiere Pro panel included. Free for Mac and Windows.",
        lede="Four cameras, two lavs, a recorder and a phone? Send the sequence from Premiere or drop in its XML. Syn lines every clip up by its audio, tells you how sure it is about each one, and hands back a synced timeline, on your own computer.",
        os_line="macOS and Windows, with a Premiere Pro panel",
        demo=SYN_DEMO, demo_label="A multicam timeline with eight tracks out of step. Syn lines them up on the clap and gives each clip a confidence score, from 99% down to one phone clip flagged to check. Twelve more tracks are folded into one row.",
        caption="Twenty tracks in. One synced timeline out, every clip scored.",
        features_title='Every clip lined up. <span class="thin">Every one scored.</span>',
        features_lede="No slate, no matching timecode, no nudging waveforms by eye. Syn listens to the audio and does the lining up.",
        cards=[
            card("span-3 wide", "music", "Synced by sound", "Syn finds the same moments in every clip&rsquo;s audio, a clap, a word, a door, and lines the clips up to the frame. Cameras that stopped and started get every take placed.", '<div class="chips" aria-label="Syncs"><span class="chip on">Cameras</span><span class="chip on">Lavs</span><span class="chip on">Recorders</span><span class="chip on">Phones</span><span class="chip">Drones</span><span class="chip">GoPros</span></div>', lime=True),
            card("span-3 wide", "check", "A confidence score on every clip", "Each clip gets a score for how sure Syn is of its sync. Anything low is flagged, so you check one clip instead of the whole timeline.", '<div class="confs" aria-label="Example scores"><span class="conf hi">99%</span><span class="conf hi">96%</span><span class="conf mid">87%</span><span class="conf lo">Check</span></div>'),
            card("span-2", "layers", "Built for big shoots", "Twenty cameras and mics, or sixty. Tracks group by camera and device and fold away once synced, so the timeline stays readable."),
            card("span-2", "bolt", "A Premiere Pro panel", "Send the open sequence to Syn and get the synced one back, from a panel inside Premiere. No exporting XMLs by hand."),
            card("span-2", "file", "Originals untouched", "Syn writes a new XML and a new sequence. Your media is read, never moved, renamed or re-encoded."),
        ],
        how_title='Send it. <span class="thin">Syn lines it up.</span>',
        how_lede="Use the panel in Premiere, or drag XMLs in and out if you prefer.",
        steps=[step("Send the sequence", "Click Send in the Syn panel in Premiere, or drop an exported XML onto Syn."),
               step("Syn listens", "It analyses every track&rsquo;s audio on your computer and lines the clips up, with live progress on each one."),
               step("Back to the edit", "Check anything flagged, then send the synced sequence back to Premiere or save it as an XML.")],
        private_lede="Syn never uploads your footage. Audio is analysed on your own computer, so client work and unreleased shoots stay where they are.",
        servers_line="Audio is analysed on your machine. Your footage never leaves it.",
        mac_req="Apple silicon",
        mac_url="https://github.com/YuvrajxGarg/syn/releases/latest/download/Syn.dmg",
        win_url="https://github.com/YuvrajxGarg/syn/releases/latest/download/Syn-Setup.exe",
        mac_note="Open it and drag <b>Syn</b> to Applications. The first time, right-click it and choose <b>Open</b>.",
        win_note="Run the setup. It adds Syn to the Start menu. If SmartScreen appears, click <b>More info</b>, then <b>Run anyway</b>.",
        fine="Syn reads and writes Premiere Pro XML. The timeline above is drawn in HTML, not a screenshot.",
    ),
    dict(
        id="pin", name="Pin", glyph="pin",
        tagline="Your Pinterest feed, as a screensaver.",
        tagline_html='<span class="t-thin">Your Pinterest feed,</span> <span class="t-bold">as a screensaver.</span>',
        description="Pin is a free screensaver for Mac and Windows that fills your screen with a slowly scrolling wall of pins from your Pinterest home feed or any public board, plus an app to see, save and hide them.",
        og="A slowly scrolling wall of your pins whenever your computer idles, and an app to save or hide them. Free for Mac and Windows.",
        lede="When your computer idles, Pin fills the screen with a slow, drifting wall of pins from your home feed or any public board. The Pin app shows every pin it has, saves the ones you love as images, and hides the ones you never want to see again.",
        os_line="macOS and Windows",
        demo=PIN_DEMO, demo_label="A screensaver of pin images in five masonry columns drifting upward at different speeds, with a clock in the corner. One pin folds away as it is hidden.",
        caption="Columns drift at their own pace, so the wall never looks like it's repeating.",
        features_title='Your feed on the big screen. <span class="thin">On your terms.</span>',
        features_lede="A screensaver that feels like scrolling Pinterest with your hands off the keyboard, and an app to curate it.",
        cards=[
            card("span-3 wide", "layers", "A living wall of pins", "Masonry columns drift upward at slightly different speeds, pins recycle as they leave the top, and a new batch arrives every few minutes. Multiple displays get their own wall.", '<div class="chips" aria-label="Sources"><span class="chip on">Home feed</span><span class="chip on">Any profile</span><span class="chip on">Any board</span><span class="chip">Clock</span></div>', lime=True),
            card("span-3 wide", "eye", "Hide what you don't want", "Hide a pin in the app and it never shows in the screensaver again, and isn't downloaded again either. Changed your mind? It's one click to bring it back."),
            card("span-2", "down", "Save the good ones", "Save any pin, or a whole selection, as a normal JPG or PNG. Or copy it straight to the clipboard."),
            card("span-2", "resume", "Refresh on demand", "Pull a fresh batch of pins whenever you like, or start over with an entirely new set."),
            card("span-2", "bolt", "Works offline", "Up to 200 pins are kept on disk, so the screensaver starts instantly, even without Wi-Fi."),
        ],
        how_title='Install it once. <span class="thin">Then just walk away.</span>',
        how_lede="Pin sets up the screensaver for you and keeps it updated.",
        steps=[step("Pick a source", "Your own home feed, or any public profile or board, like <code>nasa/space</code>."),
               step("Install the screensaver", "One click in Pin. It shows up in Screen Saver settings on Mac and Windows."),
               step("Curate", "Open Pin any time to save pins you love and hide the ones you don't.")],
        private_lede="Pin has no servers and no account of its own. Pins come straight from Pinterest to your computer, and your session cookie, if you use your home feed, never leaves it except to talk to pinterest.com.",
        servers_line="Pins download straight from Pinterest. Nothing of yours goes anywhere else.",
        mac_req="macOS 12 or later · Apple silicon",
        mac_url="https://github.com/YuvrajxGarg/pin/releases/latest/download/Pin.dmg",
        win_url="https://github.com/YuvrajxGarg/pin/releases/latest/download/Pin-Setup.exe",
        mac_note="Open it and drag <b>Pin</b> to Applications. The first time, right-click it and choose <b>Open</b>, then click <b>Allow</b> when macOS asks about data from other apps.",
        win_note="Run the setup. It adds Pin to the Start menu. If SmartScreen appears, click <b>More info</b>, then <b>Run anyway</b>.",
        fine="Pin is not affiliated with Pinterest. The wall above is drawn in HTML, not real pins.",
    ),
]


# Marks. Each app's mark, used in the nav, the footer and the rendered icons, and each app's
# hero version, which carries its own intro animation (see "per-app marks" in style.css).
LUT_MARK = ('<span class="lutw"><span class="base">lut</span><span class="lime" aria-hidden="true">lut</span>'
            '<i class="gbar" aria-hidden="true"></i></span>')
HOP_MARK = '<span class="hopw">hop<i class="go" aria-hidden="true"></i></span>'
TAG_MARK = '<span class="tagw">tag<i class="strike" aria-hidden="true"></i></span>'
# Syn's static mark is the outlined brand SVG (apps/_shared/syn/mark.svg, from the syn repo's
# brand/make_mark.py), so it looks the same on every OS and in the app and Premiere panel.
SYN_MARK = '<img class="synmark" src="/assets/mark.svg" alt="" width="62" height="26">'
# Pin: "pin" with a dotless i whose dot is a lime pin head (as in the app's icon).
PIN_MARK = '<span class="pinw">p<span class="pi">\u0131<i class="head" aria-hidden="true"></i></span>n</span>'
MARKS = {"tag": TAG_MARK, "lut": LUT_MARK, "hop": HOP_MARK, "syn": SYN_MARK, "pin": PIN_MARK}

HERO_MARKS = {
    "tag": ('<div class="hero-mark wordmark anim-tag" aria-hidden="true"><span class="tagw">'
            '<span class="ch">t</span><span class="ch">a</span><span class="ch">g</span>'
            '<i class="strike"></i></span></div>'),
    "stm": ('<div class="hero-mark wordmark anim-stm" aria-hidden="true"><span class="stmw">'
            '<span class="ch">s</span><span class="ch">t</span><span class="ch">m</span>'
            '<i class="bars"><b></b><b></b><b></b><b></b></i></span></div>'),
    "lut": ('<div class="hero-mark wordmark anim-lut" aria-hidden="true"><span class="lutw"><span class="base"><b>l</b><b>u</b><b>t</b></span>'
            '<span class="lime">lut</span>'
            '<i class="gbar"></i></span></div>'),
    "hop": ('<div class="hero-mark wordmark anim-hop" aria-hidden="true"><span class="hopw">'
            '<span class="ch">h</span><span class="ch">o</span><span class="ch">p</span>'
            '<i class="go"><i class="streak"></i></i></span></div>'),
    "syn": ('<div class="hero-mark wordmark anim-syn" aria-hidden="true"><span class="synw">'
            '<span class="ch">s</span><span class="ch">y</span><span class="ch">n</span>'
            '<i class="link"><b></b><i></i><b></b></i><i class="bl"></i></span>'
            '<img class="rest" src="/assets/mark.svg" alt=""></div>'),
    "pin": ('<div class="hero-mark wordmark anim-pin" aria-hidden="true"><span class="pinw">'
            '<span class="ch">p</span><span class="ch pi">\u0131<i class="ripple"></i><i class="head"></i></span>'
            '<span class="ch">n</span></span></div>'),
}


def hero_mark(app, glyph):
    if app["id"] in HERO_MARKS:
        return HERO_MARKS[app["id"]]
    a, b, c = app["id"]
    return (f'<div class="hero-mark wordmark" aria-hidden="true"><span class="ch">{a}</span>'
            f'<span class="ch">{b}</span><span class="ch">{c}</span>{glyph}</div>')


def build(app):
    out = HERE / app["id"]
    (out / "assets").mkdir(parents=True, exist_ok=True)
    glyph = GLYPHS[app["glyph"]]
    plain = html.unescape(app["tagline"]).rstrip(".")
    mark = MARKS.get(app["id"], app["id"] + glyph)
    rel = f"https://github.com/YuvrajxGarg/{app['id']}/releases/latest"
    defaults = dict(mac_url=rel, win_url=rel,
                    mac_note="Unzip and move <b>{0}</b> to Applications. The first time, right-click it and choose <b>Open</b>.".format(app["name"]),
                    win_note="Run it. If SmartScreen appears, click <b>More info</b>, then <b>Run anyway</b>.")
    fields = dict(defaults, **app)
    fields.update(v=ASSET_VERSION, icons=ICONS, glyph=glyph, mark=mark, tagline_plain=html.escape(plain),
                  hero_mark=hero_mark(app, glyph),
                  cards="\n".join(app["cards"]), steps="\n".join(app["steps"]),
                  description=html.escape(app["description"], quote=True), og=html.escape(app["og"], quote=True))
    (out / "index.html").write_text(PAGE.format(**fields))
    (out / "404.html").write_text(NOT_FOUND.format(**fields))
    # Keep keys an app adds to its own vercel.json (Hop's relay API has crons and functions).
    cfg, vj = json.loads(VERCEL), out / "vercel.json"
    if vj.exists():
        cfg = {**json.loads(vj.read_text()), **cfg}
    vj.write_text(json.dumps(cfg, indent=2) + "\n")
    for f in ("style.css", "main.js"):
        shutil.copyfile(SHARED / f, out / "assets" / f)
    if (SHARED / app["id"] / "mark.svg").exists():
        shutil.copyfile(SHARED / app["id"] / "mark.svg", out / "assets" / "mark.svg")
    print("built", out.relative_to(HERE.parent))


if __name__ == "__main__":
    for a in APPS:
        build(a)
