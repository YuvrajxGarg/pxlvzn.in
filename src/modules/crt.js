// CRT mode: button toggle + konami code
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];

export function initCRT() {
  const btn = document.getElementById('crt-toggle');
  const state = btn.querySelector('.nav__crt-state');

  const set = (on) => {
    document.body.dataset.mode = on ? 'crt' : 'normal';
    state.textContent = on ? 'ON' : 'OFF';
  };
  const toggle = () => set(document.body.dataset.mode !== 'crt');

  btn.addEventListener('click', toggle);

  let idx = 0;
  window.addEventListener('keydown', (e) => {
    idx = e.key === KONAMI[idx] ? idx + 1 : (e.key === KONAMI[0] ? 1 : 0);
    if (idx === KONAMI.length) {
      idx = 0;
      toggle();
      console.log('%c⇑⇑⇓⇓⇐⇒⇐⇒BA — welcome home.', 'color:#c8ff00;font-weight:bold');
    }
  });
}
