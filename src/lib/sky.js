import { asset, DEG } from './dom.js';

let skyPromise;
/** Catálogo compacto: estrellas [ra, dec, mag, b-v], constelaciones y contorno de la Vía Láctea. */
export function loadSky() {
  if (!skyPromise) skyPromise = fetch(asset('data/sky.json')).then((r) => r.json());
  return skyPromise;
}

const BV_STOPS = [
  [-0.3, [155, 176, 255]],
  [0.0, [190, 205, 255]],
  [0.3, [244, 244, 255]],
  [0.6, [255, 240, 214]],
  [1.0, [255, 214, 160]],
  [1.5, [255, 172, 116]],
  [2.0, [255, 140, 90]],
];
export function bvColor(bv) {
  if (bv <= BV_STOPS[0][0]) return BV_STOPS[0][1];
  for (let i = 1; i < BV_STOPS.length; i++) {
    if (bv <= BV_STOPS[i][0]) {
      const [b0, c0] = BV_STOPS[i - 1];
      const [b1, c1] = BV_STOPS[i];
      const t = (bv - b0) / (b1 - b0);
      return c0.map((v, k) => Math.round(v + (c1[k] - v) * t));
    }
  }
  return BV_STOPS[BV_STOPS.length - 1][1];
}

/** Tiempo sidéreo medio de Greenwich, en grados. */
export function gmst(date) {
  const d = date.getTime() / 86400000 + 2440587.5 - 2451545.0;
  return (((280.46061837 + 360.98564736629 * d) % 360) + 360) % 360;
}

/** Ecuatoriales (grados) → horizontales. az medido desde el norte hacia el este. */
export function altAz(ra, dec, lst, lat) {
  const H = (lst - ra) * DEG;
  const d = dec * DEG;
  const f = lat * DEG;
  const sinAlt = Math.sin(d) * Math.sin(f) + Math.cos(d) * Math.cos(f) * Math.cos(H);
  const alt = Math.asin(sinAlt);
  const az = Math.atan2(-Math.cos(d) * Math.sin(H), Math.sin(d) * Math.cos(f) - Math.cos(d) * Math.sin(f) * Math.cos(H));
  return { alt: alt / DEG, az: ((az / DEG) + 360) % 360 };
}

/** Ecuatoriales J2000 → galácticas (grados). */
export function toGalactic(ra, dec) {
  const a = ra * DEG;
  const d = dec * DEG;
  const ag = 192.85948 * DEG;
  const dg = 27.12825 * DEG;
  const lo = 122.93192 * DEG;
  const sinb = Math.sin(d) * Math.sin(dg) + Math.cos(d) * Math.cos(dg) * Math.cos(a - ag);
  const b = Math.asin(sinb);
  const y = Math.cos(d) * Math.sin(a - ag);
  const x = Math.sin(d) * Math.cos(dg) - Math.cos(d) * Math.sin(dg) * Math.cos(a - ag);
  const l = lo - Math.atan2(y, x);
  return { l: (((l / DEG) % 360) + 360) % 360, b: b / DEG };
}

/** Ascensión recta aproximada del Sol (grados) para un día del año (0 = 1 de enero). */
export function sunRA(day) {
  const n = day - 79.5; // días desde el equinoccio de marzo
  const L = n * 0.9856; // longitud eclíptica media
  const lam = (L + 1.915 * Math.sin(((L - 4) * Math.PI) / 180)) * DEG;
  const eps = 23.44 * DEG;
  return ((Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)) / DEG) + 360) % 360;
}

/** Día del año (0-365) en el que un objeto de ascensión recta `ra` culmina a medianoche. */
export function oppositionDay(ra) {
  let best = 0;
  let bestErr = 999;
  for (let d = 0; d < 366; d++) {
    const diff = Math.abs((((sunRA(d) + 180 - ra) % 360) + 540) % 360 - 180);
    if (diff < bestErr) {
      bestErr = diff;
      best = d;
    }
  }
  return best;
}

export const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function dayOfYear(date = new Date()) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  return Math.floor((date.getTime() - start) / 86400000);
}

export function dayLabel(day, year = 2026) {
  const d = new Date(Date.UTC(year, 0, 1 + day));
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].toLowerCase()}`;
}
