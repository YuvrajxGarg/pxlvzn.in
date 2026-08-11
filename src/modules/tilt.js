// 3d card tilt + magnetic buttons
export function initTilt() {
  if (matchMedia('(hover: none)').matches) return;
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${px * 5}deg) rotateX(${-py * 5}deg) translateZ(0)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
}

export function initMagnetic() {
  if (matchMedia('(hover: none)').matches) return;
  document.querySelectorAll('[data-magnetic]').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      btn.style.transform = `translate(${dx * 0.22}px, ${dy * 0.22}px)`;
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.transition = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)';
      btn.style.transform = '';
      setTimeout(() => (btn.style.transition = ''), 300);
    });
  });
}
