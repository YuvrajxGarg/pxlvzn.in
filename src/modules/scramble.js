// hover decode effect: characters cycle through glyph soup then settle
const GLYPHS = '█▓▒░<>/\\[]{}#$%&@!?01';

export function initScramble() {
  document.querySelectorAll('[data-scramble]').forEach((el) => {
    const original = el.textContent;
    let raf = null;

    el.addEventListener('pointerenter', () => {
      // skip elements with child markup (like the nav cursor span)
      if (el.children.length) return;
      cancelAnimationFrame(raf);
      const start = performance.now();
      const dur = 380;

      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const settled = Math.floor(p * original.length);
        let out = original.slice(0, settled);
        for (let i = settled; i < original.length; i++) {
          const ch = original[i];
          out += /\s/.test(ch) ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        el.textContent = out;
        if (p < 1) raf = requestAnimationFrame(step);
        else el.textContent = original;
      };
      raf = requestAnimationFrame(step);
    });
  });
}
