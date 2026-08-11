import './styles/main.css';
import { runBoot } from './modules/boot.js';
import { initHero } from './modules/hero3d.js';
import { initCursor } from './modules/cursor.js';
import { initScramble } from './modules/scramble.js';
import { initReveal } from './modules/reveal.js';
import { initTilt, initMagnetic } from './modules/tilt.js';
import { initStatusbar } from './modules/statusbar.js';
import { initLab } from './modules/lab.js';
import { drawThumbs } from './modules/thumbs.js';
import { initFooter } from './modules/footer.js';
import { initCRT } from './modules/crt.js';
import { initMarquee } from './modules/marquee.js';

console.log(
  '%cPXLVZN %c— you opened the console. we like you already.\n' +
  'the whole site is hand-rolled: three.js + canvas 2d + vanilla js.\n' +
  'try the konami code. or email us: workwithyuvraj@gmail.com',
  'font-weight:bold;color:#c8ff00;font-size:16px', 'color:#8a8a8a'
);

document.getElementById('year').textContent = new Date().getFullYear();

initCursor();
initStatusbar();
initScramble();
initReveal();
initTilt();
initMagnetic();
initCRT();
initMarquee();
drawThumbs();

runBoot().then(() => {
  initHero();
  initLab();
  initFooter();
});
