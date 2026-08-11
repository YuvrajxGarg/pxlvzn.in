// fake terminal boot — short, skippable, sets the tone
const LINES = [
  ['dim', 'PXLVZN BIOS v0.1.0 — "larval stage"'],
  ['dim', 'checking display........................ '],
  ['ok', 'OK (it has pixels)'],
  ['dim', 'loading vision.......................... '],
  ['ok', 'OK (20/20)'],
  ['dim', 'mounting /registry ..................... '],
  ['ok', 'OK (4 pkgs)'],
  ['dim', 'calibrating taste ...................... '],
  ['ok', 'OK (opinionated)'],
  ['', ''],
  ['', '> every pixel on purpose. entering...'],
];

export function runBoot() {
  const boot = document.getElementById('boot');
  const log = document.getElementById('boot-log');
  const seen = sessionStorage.getItem('pxlvzn-booted');

  return new Promise((resolve) => {
    const finish = () => {
      if (boot.classList.contains('is-done')) return;
      boot.classList.add('is-done');
      sessionStorage.setItem('pxlvzn-booted', '1');
      window.removeEventListener('keydown', finish);
      boot.removeEventListener('click', finish);
      resolve();
    };

    if (seen) { finish(); return; }

    window.addEventListener('keydown', finish);
    boot.addEventListener('click', finish);

    let i = 0;
    const tick = () => {
      if (boot.classList.contains('is-done')) return;
      if (i >= LINES.length) { setTimeout(finish, 500); return; }
      const [cls, text] = LINES[i++];
      const span = document.createElement('span');
      if (cls) span.className = cls;
      // "OK" fragments append to the previous line, others start a new one
      span.textContent = (cls === 'ok' ? '' : (log.textContent ? '\n' : '')) + text;
      log.appendChild(span);
      setTimeout(tick, cls === 'ok' ? 60 : 140);
    };
    tick();
  });
}
