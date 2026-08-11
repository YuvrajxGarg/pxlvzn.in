// scroll-in reveals + count-up stats
export function initReveal() {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      e.target.querySelectorAll('[data-count]').forEach(runCount);
      if (e.target.hasAttribute('data-count')) runCount(e.target);
      io.unobserve(e.target);
    }
  }, { threshold: 0.15 });

  document.querySelectorAll('[data-reveal]').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 60}ms`;
    io.observe(el);
  });
}

function runCount(el) {
  if (el.dataset.done) return;
  el.dataset.done = '1';
  const end = parseInt(el.dataset.count, 10);
  const dur = 1200;
  const start = performance.now();
  const fmt = new Intl.NumberFormat('en-US');

  const step = (now) => {
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - (1 - p) ** 3;
    el.textContent = fmt.format(Math.round(end * eased));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
