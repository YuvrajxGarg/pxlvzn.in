// generative thumbnails for registry cards — no stock art, ever.
// each tool gets its own procedural identity, drawn once at low-res.
const VOLT = '#c8ff00', MAG = '#ff3df5', CYAN = '#24e0ff', DARK = '#0a0a0a';

function lowres(canvas, w = 140) {
  const h = Math.round(w * (canvas.height / canvas.width));
  canvas.width = w; canvas.height = h;
  return [canvas.getContext('2d'), w, h];
}

const GENERATORS = {
  // revolio: diffusion-noise resolving into ordered scanlines (chaos → intent)
  revolio(canvas) {
    const [ctx, W, H] = lowres(canvas);
    ctx.fillStyle = DARK; ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y++) {
      const order = y / H; // more ordered toward the bottom
      for (let x = 0; x < W; x++) {
        if (Math.random() < 0.5) continue;
        const noisy = Math.random() > order;
        ctx.fillStyle = noisy
          ? `rgba(255,255,255,${Math.random() * 0.25})`
          : (x % 6 < 3 ? VOLT : DARK);
        if (noisy || x % 6 < 3) ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.fillStyle = MAG;
    ctx.fillRect(0, (H * 0.72) | 0, W, 1);
  },

  // fetch: a download arrow made of falling pixel streaks
  fetch(canvas) {
    const [ctx, W, H] = lowres(canvas);
    ctx.fillStyle = DARK; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) {
      const x = (Math.random() * W) | 0;
      const y = (Math.random() * H) | 0;
      const len = 2 + (Math.random() * 10) | 0;
      ctx.fillStyle = Math.random() > 0.8 ? CYAN : 'rgba(255,255,255,0.12)';
      ctx.fillRect(x, y, 1, len);
    }
    // chunky arrow
    ctx.fillStyle = VOLT;
    const cx = W >> 1, cy = (H * 0.42) | 0, s = 4;
    ctx.fillRect(cx - s, cy - s * 3, s * 2, s * 4);
    for (let i = 0; i < 4; i++) ctx.fillRect(cx - (s * 3 - i * s), cy + i * s, (s * 3 - i * s) * 2, s);
    ctx.fillRect(cx - s * 3, cy + s * 4 + 2, s * 6, 2);
  },

  // canvas: infinite zoom rectangles
  canvas(canvas) {
    const [ctx, W, H] = lowres(canvas);
    ctx.fillStyle = DARK; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;
    for (let i = 14; i > 0; i--) {
      const s = i / 14;
      ctx.strokeStyle = i % 3 === 0 ? VOLT : i % 3 === 1 ? 'rgba(255,255,255,0.25)' : MAG;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - (W * 0.46) * s, cy - (H * 0.42) * s, W * 0.92 * s, H * 0.84 * s);
    }
    ctx.fillStyle = CYAN;
    ctx.fillRect(cx - 1, cy - 1, 2, 2);
  },

  // vinyl: a pixel record spinning in the groove
  vinyl(canvas) {
    const [ctx, W, H] = lowres(canvas);
    ctx.fillStyle = DARK; ctx.fillRect(0, 0, W, H);
    const cx = W >> 1, cy = H >> 1, maxR = Math.min(cx, cy) - 4;
    // grooves — dotted concentric circles
    for (let r = maxR; r > 8; r -= 2) {
      const steps = Math.floor(r * 5);
      for (let s = 0; s < steps; s++) {
        if (Math.random() < 0.35) continue;
        const a = (s / steps) * Math.PI * 2;
        ctx.fillStyle = r % 8 === 0 ? VOLT : `rgba(255,255,255,${0.06 + Math.random() * 0.1})`;
        ctx.fillRect((cx + Math.cos(a) * r) | 0, (cy + Math.sin(a) * r) | 0, 1, 1);
      }
    }
    // label + spindle
    ctx.fillStyle = MAG;
    ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = DARK;
    ctx.fillRect(cx - 1, cy - 1, 2, 2);
    // tonearm glint
    ctx.fillStyle = CYAN;
    ctx.fillRect(cx + maxR - 6, cy - maxR + 2, 1, 6);
  },

  // slot: static + a question mark of noise
  slot(canvas) {
    const [ctx, W, H] = lowres(canvas);
    ctx.fillStyle = DARK; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < W * H * 0.3; i++) {
      const v = Math.random();
      ctx.fillStyle = v > 0.97 ? MAG : `rgba(255,255,255,${v * 0.12})`;
      ctx.fillRect((Math.random() * W) | 0, (Math.random() * H) | 0, 1, 1);
    }
    ctx.fillStyle = MAG;
    ctx.font = '700 40px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', W / 2, H / 2 + 2);
  },
};

export function drawThumbs() {
  document.querySelectorAll('.pkg__thumb[data-gen]').forEach((c) => {
    const gen = GENERATORS[c.dataset.gen];
    if (gen) gen(c);
  });
}
