import { asset, fitCanvas, DEG, TAU } from '../lib/dom.js';
import { loadSky, bvColor } from '../lib/sky.js';

export default {
  id: 'cover',
  title: 'Portada',
  tone: 'dark',
  steps: 0,
  bg: () => `<div class="cover__photo" style="background-image:url(${asset('img/hero.jpg')})"></div><div class="cover__shade"></div><canvas class="cover__stars fill"></canvas>`,
  html: (cfg) => `
    <div class="cover">
      <p class="eyebrow rise">Charla · Astrofotografía</p>
      <h1 class="title title--xl rise">Astro&shy;fotografía<br /><em>para fotógrafos</em></h1>
      <div class="cover__by rise">
        <span class="cover__name">${cfg.author.name}</span>
        <span class="cover__tag">${cfg.author.tagline}</span>
      </div>
    </div>`,
  mount(el, ctx) {
    const canvas = el.querySelector('canvas');
    const view = fitCanvas(canvas);
    let stars = [];
    loadSky().then((sky) => {
      stars = sky.stars
        .filter((s) => s[2] < 4.6 && s[1] > 5)
        .map((s) => ({ ra: s[0] * DEG, r: (90 - s[1]) * DEG, mag: s[2], c: bvColor(s[3]) }));
    });
    let ang = 0;
    ctx.loop((dt) => {
      const { ctx: g, w, h } = view;
      if (!w) return;
      ang += dt * 0.012 * (ctx.reduced ? 0 : 1);
      g.clearRect(0, 0, w, h);
      // el polo celeste queda arriba a la derecha y el cielo gira a su alrededor
      const px = w * 0.78;
      const py = h * 0.16;
      const scale = h * 1.05;
      g.lineCap = 'round';
      for (const s of stars) {
        const a = s.ra + ang;
        const rad = Math.sin(s.r) * scale * 1.2;
        const x = px + rad * Math.cos(a);
        const y = py + rad * Math.sin(a);
        if (x < -20 || x > w + 20 || y < -20 || y > h + 20) continue;
        const size = Math.max(0.6, (5.2 - s.mag) * 0.9) * (w / 1600);
        const [r, gr, b] = s.c;
        const tail = 0.012 + (5 - s.mag) * 0.006;
        g.strokeStyle = `rgba(${r},${gr},${b},${0.55})`;
        g.lineWidth = size * 0.9;
        g.beginPath();
        g.arc(px, py, rad, a - tail, a);
        g.stroke();
        g.fillStyle = `rgb(${r},${gr},${b})`;
        g.beginPath();
        g.arc(x, y, size * 0.95, 0, TAU);
        g.fill();
      }
    });
  },
};
