// live experiments — each canvas runs only while on screen
const CELL = 6;

function onVisible(canvas, start, stop) {
  const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.05 });
  io.observe(canvas);
}

function fit(canvas) {
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(r.width / CELL));
  canvas.height = Math.max(1, Math.floor(r.height / CELL));
}

/* ── conway's game of life ── */
function initLife(canvas) {
  const ctx = canvas.getContext('2d');
  fit(canvas);
  const W = canvas.width, H = canvas.height;
  let grid = new Uint8Array(W * H);
  let next = new Uint8Array(W * H);

  // seed a glider gun-ish random soup
  for (let i = 0; i < W * H; i++) grid[i] = Math.random() > 0.82 ? 1 : 0;

  const paint = (e) => {
    const r = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * W);
    const y = Math.floor(((e.clientY - r.top) / r.height) * H);
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const xi = (x + dx + W) % W, yi = (y + dy + H) % H;
        if (Math.random() > 0.4) grid[yi * W + xi] = 1;
      }
  };
  canvas.addEventListener('pointermove', paint);
  canvas.addEventListener('pointerdown', paint);

  let raf = null, tick = 0;
  const step = () => {
    raf = requestAnimationFrame(step);
    if (tick++ % 4 !== 0) return; // ~15 generations/sec

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            n += grid[((y + dy + H) % H) * W + ((x + dx + W) % W)];
          }
        const alive = grid[y * W + x];
        next[y * W + x] = alive ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0);
      }
    }
    [grid, next] = [next, grid];

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#c8ff00';
    for (let i = 0; i < W * H; i++) {
      if (grid[i]) ctx.fillRect(i % W, (i / W) | 0, 1, 1);
    }
  };
  onVisible(canvas, () => { if (!raf) step(); }, () => { cancelAnimationFrame(raf); raf = null; });
}

/* ── pixel rain ── */
function initRain(canvas) {
  const ctx = canvas.getContext('2d');
  fit(canvas);
  const W = canvas.width, H = canvas.height;
  const COLS = ['#c8ff00', '#ff3df5', '#24e0ff', '#555'];
  const drops = Array.from({ length: Math.floor(W * 0.7) }, () => ({
    x: (Math.random() * W) | 0,
    y: Math.random() * H,
    v: 0.2 + Math.random() * 0.7,
    c: COLS[(Math.random() * COLS.length) | 0],
    len: 2 + (Math.random() * 6) | 0,
  }));

  let raf = null;
  const step = () => {
    raf = requestAnimationFrame(step);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, 0, W, H);
    for (const d of drops) {
      ctx.fillStyle = d.c;
      ctx.fillRect(d.x, d.y | 0, 1, d.len);
      d.y += d.v;
      if (d.y > H) { d.y = -d.len; d.x = (Math.random() * W) | 0; }
    }
  };
  onVisible(canvas, () => { if (!raf) step(); }, () => { cancelAnimationFrame(raf); raf = null; });
}

/* ── animated bayer dither field ── */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function initDither(canvas) {
  const ctx = canvas.getContext('2d');
  fit(canvas);
  const W = canvas.width, H = canvas.height;
  const img = ctx.createImageData(W, H);
  let mx = W / 2, my = H / 2;

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width) * W;
    my = ((e.clientY - r.top) / r.height) * H;
  });

  let raf = null, t = 0;
  const step = () => {
    raf = requestAnimationFrame(step);
    t += 0.03;
    const d = img.data;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const dx = x - mx, dy = y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // layered waves + cursor ripple
        let v =
          Math.sin(x * 0.09 + t) * 0.3 +
          Math.sin(y * 0.11 - t * 0.8) * 0.3 +
          Math.sin(dist * 0.25 - t * 2.2) * 0.4;
        v = (v + 1) / 2; // 0..1
        const on = v * 16 > BAYER[y % 4][x % 4] ? 1 : 0;
        const i = (y * W + x) * 4;
        d[i] = on ? 200 : 6;
        d[i + 1] = on ? 255 : 6;
        d[i + 2] = on ? 0 : 6;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  };
  onVisible(canvas, () => { if (!raf) step(); }, () => { cancelAnimationFrame(raf); raf = null; });
}

export function initLab() {
  const life = document.getElementById('lab-life');
  const rain = document.getElementById('lab-rain');
  const dither = document.getElementById('lab-dither');
  if (life) initLife(life);
  if (rain) initRain(rain);
  if (dither) initDither(dither);
}
