// animated generative thumbnails for registry cards — no stock art, ever.
// each tool gets a procedural identity that runs live (and pauses off-screen).
const VOLT = '#c8ff00', MAG = '#ff3df5', CYAN = '#24e0ff', DARK = '#0a0a0a';

function lowres(canvas, w = 140) {
  const h = Math.round(w * (canvas.height / canvas.width));
  canvas.width = w; canvas.height = h;
  return [canvas.getContext('2d'), w, h];
}

// each builder gets (ctx, W, H) once and returns frame(t, dt)
const BUILDERS = {
  // revolio: diffusion noise forever resolving into ordered scanlines
  revolio(ctx, W, H) {
    return (t) => {
      ctx.fillStyle = DARK; ctx.fillRect(0, 0, W, H);
      const breathe = Math.sin(t * 0.6) * 0.25; // order boundary drifts
      for (let y = 0; y < H; y++) {
        const order = y / H + breathe;
        for (let x = 0; x < W; x++) {
          if (Math.random() < 0.55) continue;
          if (Math.random() > order) {
            ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.25})`;
            ctx.fillRect(x, y, 1, 1);
          } else if (x % 6 < 3) {
            ctx.fillStyle = VOLT;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      ctx.fillStyle = MAG; // render pass sweeping down
      ctx.fillRect(0, (t * 14) % H | 0, W, 1);
    };
  },

  // fetch: pixel streaks rain past a gently bobbing download arrow
  fetch(ctx, W, H) {
    const streaks = Array.from({ length: 90 }, () => ({
      x: (Math.random() * W) | 0,
      y: Math.random() * H,
      v: 10 + Math.random() * 34,
      len: 2 + (Math.random() * 10) | 0,
      c: Math.random() > 0.8 ? CYAN : 'rgba(255,255,255,0.12)',
    }));
    return (t, dt) => {
      ctx.fillStyle = DARK; ctx.fillRect(0, 0, W, H);
      for (const s of streaks) {
        s.y += s.v * dt;
        if (s.y > H) { s.y = -s.len; s.x = (Math.random() * W) | 0; }
        ctx.fillStyle = s.c;
        ctx.fillRect(s.x, s.y | 0, 1, s.len);
      }
      ctx.fillStyle = VOLT;
      const cx = W >> 1, cy = (H * 0.42 + Math.sin(t * 2.2) * 3) | 0, s = 4;
      ctx.fillRect(cx - s, cy - s * 3, s * 2, s * 4);
      for (let i = 0; i < 4; i++) ctx.fillRect(cx - (s * 3 - i * s), cy + i * s, (s * 3 - i * s) * 2, s);
      ctx.fillRect(cx - s * 3, (H * 0.42) + s * 4 + 2 | 0, s * 6, 2);
    };
  },

  // canvas: rectangles zooming outward forever — the infinite canvas
  canvas(ctx, W, H) {
    const N = 14;
    return (t) => {
      ctx.fillStyle = DARK; ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const phase = (t * 0.22) % 1;
      for (let i = 0; i < N; i++) {
        const p = ((i + phase) % N) / N + 1 / N; // 1/N .. 1, drifting outward
        ctx.globalAlpha = Math.min(1, p * 3) * (p > 0.92 ? (1 - p) * 12 : 1);
        ctx.strokeStyle = i % 3 === 0 ? VOLT : i % 3 === 1 ? 'rgba(255,255,255,0.25)' : MAG;
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - (W * 0.46) * p, cy - (H * 0.42) * p, W * 0.92 * p, H * 0.84 * p);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = CYAN;
      ctx.fillRect(cx - 1, cy - 1, 2, 2);
    };
  },

  // vinyl: the record actually spins at 33⅓
  vinyl(ctx, W, H) {
    const cx = W >> 1, cy = H >> 1, maxR = Math.min(cx, cy) - 4;
    const dots = [];
    for (let r = maxR; r > 8; r -= 2) {
      const steps = Math.floor(r * 5);
      for (let s = 0; s < steps; s++) {
        if (Math.random() < 0.35) continue;
        dots.push({
          r, a: (s / steps) * Math.PI * 2,
          c: r % 8 === 0 ? VOLT : `rgba(255,255,255,${0.06 + Math.random() * 0.1})`,
        });
      }
    }
    return (t) => {
      ctx.fillStyle = DARK; ctx.fillRect(0, 0, W, H);
      const spin = t * 0.9; // ~33⅓ rpm in spirit
      for (const d of dots) {
        ctx.fillStyle = d.c;
        ctx.fillRect((cx + Math.cos(d.a + spin) * d.r) | 0, (cy + Math.sin(d.a + spin) * d.r) | 0, 1, 1);
      }
      ctx.fillStyle = MAG;
      ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = DARK;
      ctx.fillRect(cx - 1, cy - 1, 2, 2);
      ctx.fillStyle = CYAN; // tonearm glint stays put while the disc turns
      ctx.fillRect(cx + maxR - 6, cy - maxR + 2, 1, 6);
    };
  },

  // slot: broadcast static; the question mark glitches
  slot(ctx, W, H) {
    return (t) => {
      ctx.fillStyle = DARK; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < W * H * 0.3; i++) {
        const v = Math.random();
        ctx.fillStyle = v > 0.97 ? MAG : `rgba(255,255,255,${v * 0.12})`;
        ctx.fillRect((Math.random() * W) | 0, (Math.random() * H) | 0, 1, 1);
      }
      const glitch = Math.random() < 0.12;
      const jx = glitch ? (Math.random() * 6 - 3) | 0 : 0;
      ctx.font = '700 40px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (glitch) { // chromatic ghost
        ctx.fillStyle = CYAN;
        ctx.fillText('?', W / 2 - jx, H / 2 + 2);
      }
      ctx.fillStyle = MAG;
      ctx.fillText('?', W / 2 + jx, H / 2 + 2);
    };
  },
};

export function drawThumbs() {
  document.querySelectorAll('.pkg__thumb[data-gen]').forEach((c) => {
    const build = BUILDERS[c.dataset.gen];
    if (!build) return;
    const [ctx, W, H] = lowres(c);
    const frame = build(ctx, W, H);
    frame(0, 0); // static first paint so nothing flashes empty

    let raf = null, last = 0, prevT = 0;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 45) return; // ~22fps — plenty for pixel art
      last = now;
      const t = now / 1000;
      frame(t, Math.min(t - prevT, 0.1));
      prevT = t;
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!raf) raf = requestAnimationFrame(loop); }
      else { cancelAnimationFrame(raf); raf = null; }
    }, { threshold: 0.05 });
    io.observe(c);
  });
}
