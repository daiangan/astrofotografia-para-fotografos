/** Longitud de onda en nm → [r, g, b] aproximado (0-255). */
export function wavelengthRGB(nm) {
  let r = 0;
  let g = 0;
  let b = 0;
  if (nm >= 380 && nm < 440) {
    r = -(nm - 440) / 60;
    b = 1;
  } else if (nm < 490) {
    g = (nm - 440) / 50;
    b = 1;
  } else if (nm < 510) {
    g = 1;
    b = -(nm - 510) / 20;
  } else if (nm < 580) {
    r = (nm - 510) / 70;
    g = 1;
  } else if (nm < 645) {
    r = 1;
    g = -(nm - 645) / 65;
  } else if (nm <= 780) {
    r = 1;
  }
  let f = 1;
  if (nm < 420) f = 0.3 + (0.7 * (nm - 380)) / 40;
  else if (nm > 700) f = 0.3 + (0.7 * (780 - nm)) / 80;
  const gm = 0.8;
  return [r, g, b].map((c) => Math.round(255 * Math.pow(Math.max(0, c * f), gm)));
}

export const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export function mix(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}
