// square cursor with difference blend; grows over interactive things
export function initCursor() {
  const el = document.getElementById('cursor');
  if (!el || matchMedia('(hover: none)').matches) return;

  let x = -100, y = -100;
  window.addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    const t = e.target.closest('a, button, input, [data-tilt], .lab__canvas');
    el.classList.toggle('is-hover', !!t);
  });
  window.addEventListener('pointerdown', () => el.classList.add('is-down'));
  window.addEventListener('pointerup', () => el.classList.remove('is-down'));
}
