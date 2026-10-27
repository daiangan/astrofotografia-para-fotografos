import { rng, TAU } from './dom.js';

/** Campo de estrellas ambiental que vive detrás de todas las slides. */
export function startBackground(canvas) {
  const ctx = canvas.getContext('2d');
  const r = rng(7);
  const stars = Array.from({ length: 260 }, () => ({
    x: r(),
    y: r(),
    z: 0.25 + r() * 0.75,
    s: 0.4 + r() * 1.3,
    p: r() * TAU,
    f: 0.4 + r() * 1.6,
  }));
  let w = 0;
  let h = 0;
  let dpr = 1;
  let target = 0;
  let cur = 0;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('deck:change', (e) => {
    target = e.detail.index;
  });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const frame = (now) => {
    cur += (target - cur) * 0.05;
    ctx.clearRect(0, 0, w, h);
    const t = now / 1000;
    for (const s of stars) {
      let x = (s.x - (cur * 0.012 * s.z)) % 1;
      if (x < 0) x += 1;
      const a = reduced ? 0.7 : 0.45 + 0.4 * Math.sin(t * s.f + s.p);
      ctx.globalAlpha = a * s.z;
      ctx.fillStyle = '#cfe0ff';
      ctx.beginPath();
      ctx.arc(x * w, s.y * h, s.s * s.z, 0, TAU);
      ctx.fill();
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
