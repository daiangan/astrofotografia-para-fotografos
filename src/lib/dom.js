export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gauss(r) {
  let u = 0;
  let v = 0;
  while (u === 0) u = r();
  while (v === 0) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
}

export const $ = (root, sel) => root.querySelector(sel);
export const $$ = (root, sel) => Array.from(root.querySelectorAll(sel));

export const asset = (p) => import.meta.env.BASE_URL + p;

export const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

export function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const imageCache = new Map();
export function loadImage(name) {
  const src = name.includes('/') ? asset(name) : asset(`img/${name}.jpg`);
  if (!imageCache.has(src)) {
    imageCache.set(
      src,
      new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      }),
    );
  }
  return imageCache.get(src);
}

/** Ajusta el canvas a su tamaño CSS y a la densidad de píxeles. Las coordenadas de dibujo son px CSS. */
export function fitCanvas(canvas, onResize) {
  const ctx = canvas.getContext('2d');
  const api = { canvas, ctx, w: 0, h: 0, dpr: 1 };
  const apply = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (w === api.w && h === api.h && dpr === api.dpr) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    api.w = w;
    api.h = h;
    api.dpr = dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!onResize) return;
    // la primera vez se difiere para que el llamador termine de declarar su estado
    if (!api.ready) {
      api.ready = true;
      queueMicrotask(() => onResize(api));
    } else onResize(api);
  };
  new ResizeObserver(apply).observe(canvas);
  apply();
  return api;
}

/** Dibuja una imagen con object-fit: cover dentro del rectángulo indicado. */
export function drawCover(ctx, img, x, y, w, h, fx = 0.5, fy = 0.5, zoom = 1) {
  const s = Math.max(w / img.width, h / img.height) * zoom;
  const sw = w / s;
  const sh = h / s;
  const sx = (img.width - sw) * fx;
  const sy = (img.height - sh) * fy;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function bindRange(input, fn, { init = true } = {}) {
  const run = () => {
    const min = parseFloat(input.min || 0);
    const max = parseFloat(input.max || 100);
    input.style.setProperty('--pct', `${((input.value - min) / (max - min)) * 100}%`);
    fn(parseFloat(input.value));
  };
  input.addEventListener('input', run);
  input.addEventListener('change', () => input.blur());
  if (init) run();
  return run;
}

export function setRange(input, v) {
  input.value = v;
  input.dispatchEvent(new Event('input'));
}

/** Grupo de botones excluyentes: <div data-seg><button data-v="a">…</button></div> */
export function bindSegmented(group, fn) {
  const btns = $$(group, 'button');
  const select = (v, silent) => {
    btns.forEach((b) => b.classList.toggle('on', b.dataset.v === String(v)));
    if (!silent) fn(v);
  };
  btns.forEach((b) => b.addEventListener('click', () => select(b.dataset.v)));
  return select;
}

/** Interpolación animada de un valor numérico. */
export function tween(from, to, ms, onUpdate, ease = easeOut) {
  const t0 = performance.now();
  let alive = true;
  const frame = (now) => {
    if (!alive) return;
    const k = clamp((now - t0) / ms, 0, 1);
    onUpdate(lerp(from, to, ease(k)), k);
    if (k < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  return () => {
    alive = false;
  };
}



/** Devuelve los píxeles de una imagen recortada tipo "cover" a w×h. */
export function imagePixels(img, w, h, fx = 0.5, fy = 0.5, zoom = 1) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  drawCover(g, img, 0, 0, w, h, fx, fy, zoom);
  return g.getImageData(0, 0, w, h);
}
