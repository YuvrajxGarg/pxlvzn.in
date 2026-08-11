// live hud: fps / resolution / pointer / scroll depth / clock
export function initStatusbar() {
  const fps = document.getElementById('sb-fps');
  const res = document.getElementById('sb-res');
  const ptr = document.getElementById('sb-ptr');
  const scr = document.getElementById('sb-scroll');
  const time = document.getElementById('sb-time');

  const pad = (n, l = 4) => String(n).padStart(l, '0');

  const updateRes = () => (res.textContent = `RES ${innerWidth}×${innerHeight}`);
  updateRes();
  window.addEventListener('resize', updateRes);

  window.addEventListener('pointermove', (e) => {
    ptr.textContent = `PTR ${pad(e.clientX)},${pad(e.clientY)}`;
  }, { passive: true });

  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.round((scrollY / max) * 100) : 0;
    scr.textContent = `SCRL ${pad(p, 3)}%`;
  }, { passive: true });

  setInterval(() => {
    time.textContent = new Date().toLocaleTimeString('en-GB');
  }, 1000);

  // fps counter — averaged over ~500ms
  let frames = 0, last = performance.now();
  const loop = (now) => {
    frames++;
    if (now - last >= 500) {
      fps.textContent = `FPS ${Math.round((frames * 1000) / (now - last))}`;
      frames = 0; last = now;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
