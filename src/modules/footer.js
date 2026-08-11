// footer: giant pixel wordmark that ripples as your cursor sweeps it
const WORD = 'PXLVZN';

export function initFooter() {
  const canvas = document.getElementById('footer-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let cells = [], CW = 0, CH = 0, cellSize = 6;
  let mx = -9999, my = -9999;

  function build() {
    const r = canvas.getBoundingClientRect();
    cellSize = 6;
    CW = Math.floor(r.width / cellSize);
    CH = Math.floor(r.height / cellSize);
    canvas.width = CW; canvas.height = CH;

    // rasterize the word to fit the footer width
    const off = document.createElement('canvas');
    off.width = CW; off.height = CH;
    const octx = off.getContext('2d', { willReadFrequently: true });
    octx.fillStyle = '#fff';
    let size = CH;
    do {
      octx.font = `700 ${size}px "JetBrains Mono", monospace`;
      size -= 2;
    } while (octx.measureText(WORD).width > CW * 0.94 && size > 8);
    octx.clearRect(0, 0, CW, CH);
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillText(WORD, CW / 2, CH / 2);
    const img = octx.getImageData(0, 0, CW, CH).data;

    cells = [];
    for (let y = 0; y < CH; y++)
      for (let x = 0; x < CW; x++)
        if (img[(y * CW + x) * 4 + 3] > 128) cells.push([x, y]);
  }
  build();
  window.addEventListener('resize', build);

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width) * CW;
    my = ((e.clientY - r.top) / r.height) * CH;
  });
  canvas.addEventListener('pointerleave', () => { mx = -9999; my = -9999; });

  let raf = null, t = 0;
  const step = () => {
    raf = requestAnimationFrame(step);
    t += 0.04;
    ctx.fillStyle = '#060606';
    ctx.fillRect(0, 0, CW, CH);
    for (const [x, y] of cells) {
      const dx = x - mx, dy = y - my;
      const d = Math.sqrt(dx * dx + dy * dy);
      const ripple = d < 14 ? (1 - d / 14) : 0;
      const wave = Math.sin(x * 0.15 + t) * 0.5 + 0.5;
      if (ripple > 0.02) {
        ctx.fillStyle = ripple > 0.5 ? '#ff3df5' : '#c8ff00';
      } else {
        const v = 40 + wave * 50;
        ctx.fillStyle = `rgb(${v},${v},${v})`;
      }
      ctx.fillRect(x, y, 1, 1);
    }
  };

  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { if (!raf) step(); }
    else { cancelAnimationFrame(raf); raf = null; }
  }, { threshold: 0.05 });
  io.observe(canvas);
}
