// infinite marquee — duplicates content until it can loop seamlessly
export function initMarquee() {
  const track = document.getElementById('marquee-track');
  if (!track) return;
  const base = track.innerHTML;
  // ensure at least 2x viewport width of content
  while (track.scrollWidth < innerWidth * 2.2) track.innerHTML += base;

  let x = 0;
  const half = () => track.scrollWidth / 2;
  const step = () => {
    x -= 0.6;
    if (-x >= half()) x += half();
    track.style.transform = `translateX(${x}px)`;
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
