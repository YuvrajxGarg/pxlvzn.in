// sound engine — zero audio files, everything synthesized in the browser.
// default OFF (autoplay is rude); the SND button boots the whole rig.
let ctx = null;
let master, sfxBus, musicBus;
let enabled = false;
let schedulerId = null;

function boot() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = 0.6;
  master.connect(ctx.destination);

  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.5;
  sfxBus.connect(master);

  musicBus = ctx.createGain();
  musicBus.gain.value = 0.0;
  // lo-fi color: everything musical goes through a lowpass + space delay
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1400;
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.28;
  const fb = ctx.createGain();
  fb.gain.value = 0.32;
  const wet = ctx.createGain();
  wet.gain.value = 0.35;
  musicBus.connect(lp);
  lp.connect(master);
  lp.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(wet);
  wet.connect(master);
}

/* ── tiny synth voices ── */
function tone(bus, { type = 'square', f0 = 440, f1 = f0, dur = 0.08, vol = 0.05, when = 0 }) {
  const t = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(bus);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function hat(when, vol = 0.02) {
  const t = ctx.currentTime + when;
  const len = 0.04;
  const buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 6000;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(hp); hp.connect(g); g.connect(musicBus);
  src.start(t);
}

/* ── sfx ── */
let lastBlip = 0;
export function sfxBlip() {
  if (!enabled) return;
  const now = performance.now();
  if (now - lastBlip < 70) return; // don't machine-gun on fast mouse sweeps
  lastBlip = now;
  tone(sfxBus, { type: 'square', f0: 520 + Math.random() * 200, f1: 880, dur: 0.05, vol: 0.025 });
}

export function sfxClick() {
  if (!enabled) return;
  tone(sfxBus, { type: 'square', f0: 240, f1: 180, dur: 0.06, vol: 0.05 });
}

export function sfxToggle(on) {
  if (!ctx) return;
  tone(sfxBus, { type: 'square', f0: on ? 300 : 700, f1: on ? 900 : 200, dur: 0.16, vol: 0.06 });
}

/* ── generative music: A-minor pentatonic, 92bpm, forever ── */
const SCALE = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33]; // A pent across 2 octaves
const CHORDS = [
  [110.0, 164.81, 220.0],  // Am
  [87.31, 130.81, 174.61], // F-ish
  [98.0, 146.83, 196.0],   // G
  [110.0, 164.81, 261.63], // Am add
];

function startMusic() {
  const bpm = 92;
  const sixteenth = 60 / bpm / 4;
  let step = 0;
  let nextTime = ctx.currentTime + 0.1;
  let arpIdx = 2;

  musicBus.gain.cancelScheduledValues(ctx.currentTime);
  musicBus.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 1.5);

  schedulerId = setInterval(() => {
    // schedule everything due in the next 200ms
    while (nextTime < ctx.currentTime + 0.2) {
      const when = nextTime - ctx.currentTime;
      const bar = Math.floor(step / 16);

      // pad chord every 2 bars — slow triangle swells
      if (step % 32 === 0) {
        for (const f of CHORDS[(bar / 2) % CHORDS.length | 0]) {
          tone(musicBus, { type: 'triangle', f0: f, dur: sixteenth * 30, vol: 0.05, when });
        }
      }
      // arpeggio random-walks the scale, resting sometimes
      if (step % 2 === 0 && Math.random() > 0.25) {
        arpIdx = Math.min(SCALE.length - 1, Math.max(0, arpIdx + ((Math.random() * 3) | 0) - 1));
        tone(musicBus, { type: 'square', f0: SCALE[arpIdx], dur: sixteenth * 1.8, vol: 0.028, when });
      }
      // hats on the off-eighths
      if (step % 4 === 2) hat(when, 0.012 + Math.random() * 0.008);

      step++;
      nextTime += sixteenth;
    }
  }, 100);
}

function stopMusic() {
  if (schedulerId) { clearInterval(schedulerId); schedulerId = null; }
  if (ctx) musicBus.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
}

/* ── wiring ── */
export function initAudio() {
  const btn = document.getElementById('snd-toggle');
  const state = btn.querySelector('.nav__snd-state');

  btn.addEventListener('click', () => {
    enabled = !enabled;
    state.textContent = enabled ? 'ON' : 'OFF';
    btn.classList.toggle('is-on', enabled);
    if (enabled) {
      boot();
      ctx.resume();
      sfxToggle(true);
      startMusic();
    } else {
      sfxToggle(false);
      stopMusic();
    }
  });

  // hover blips on anything interactive
  document.addEventListener('pointerover', (e) => {
    if (e.target.closest('a, button, [data-scramble]')) sfxBlip();
  });
  // clicks
  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button, input')) sfxClick();
  });
}
