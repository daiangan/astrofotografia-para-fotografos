import { fitCanvas, loadImage, rng, DEG, TAU, cssVar } from '../lib/dom.js';
import { loadSky, bvColor } from '../lib/sky.js';

const A0 = 84.0 * DEG;
const D0 = -1.2 * DEG;
const ROT = 23 * DEG;
const FOV = 15; // grados de ancho

function project(ra, dec) {
  const a = ra * DEG;
  const d = dec * DEG;
  const cosc = Math.sin(D0) * Math.sin(d) + Math.cos(D0) * Math.cos(d) * Math.cos(a - A0);
  const x = (Math.cos(d) * Math.sin(a - A0)) / cosc;
  const y = (Math.cos(D0) * Math.sin(d) - Math.sin(D0) * Math.cos(d) * Math.cos(a - A0)) / cosc;
  return { x: -x / DEG, y: -y / DEG, ok: cosc > 0 }; // en grados, el este a la izquierda
}

const STEPS = ['La foto', 'Detecta estrellas', 'Las compara con el catálogo', 'Coordenadas en cada píxel'];

export default {
  id: 'platesolve',
  title: 'Astrometría y plate solving',
  tone: 'dark',
  steps: 3,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Procesado · astrometría</p>
      <h2 class="title rise">¿Dónde <em>estoy mirando?</em></h2>
    </div>
    <div class="ps grow">
      <div class="canvas-box ps__stage rise"><canvas id="ps-c"></canvas>
        <div class="ps__result" data-from="3"><b>RA 05h 36m</b><b>Dec −01° 12′</b><span>Campo 15° · giro 23°</span></div>
      </div>
      <ol class="ps__steps rise">
        ${STEPS.map((s, i) => `<li data-i="${i}"><i>${i + 1}</i><span>${s}</span></li>`).join('')}
      </ol>
    </div>`,
  mount(el, ctx) {
    const view = fitCanvas(el.querySelector('#ps-c'));
    const list = Array.from(el.querySelectorAll('.ps__steps li'));
    let stars = [];
    let ori = [];
    let sky = null;
    let step = 0;
    let p = [0, 0, 0, 0]; // progreso animado por paso
    const r = rng(17);
    const noise = Array.from({ length: 90 }, () => ({ x: r(), y: r(), a: 0.05 + r() * 0.2 }));

    loadSky().then((data) => {
      sky = data;
      const list2 = [];
      for (const s of data.stars) {
        const q = project(s[0], s[1]);
        if (!q.ok || Math.abs(q.x) > FOV || Math.abs(q.y) > FOV) continue;
        list2.push({ ra: s[0], dec: s[1], mag: s[2], bv: s[3], q });
      }
      stars = list2;
      ori = data.cons.find((c) => c.id === 'Ori');
    });

    // de coordenadas de cielo a píxeles de la foto (rotada)
    const toPx = (q, w, h, rot) => {
      const sc = w / FOV;
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      return { x: w / 2 + (q.x * c - q.y * s) * sc, y: h / 2 + (q.x * s + q.y * c) * sc };
    };

    ctx.loop((dt) => {
      // animar el progreso de cada paso
      for (let i = 1; i <= 3; i++) {
        const target = step >= i ? 1 : 0;
        p[i] += (target - p[i]) * Math.min(1, dt * (target ? 1.6 : 4));
      }
      const { ctx: g, w, h } = view;
      if (!w || !stars.length) return;
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#02030a';
      g.fillRect(0, 0, w, h);
      // viñeteo y ruido de fondo
      const vg = g.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, w * 0.7);
      vg.addColorStop(0, 'rgba(30,40,80,0.35)');
      vg.addColorStop(1, 'rgba(0,0,0,0.6)');
      g.fillStyle = vg;
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#fff';
      for (const n of noise) {
        g.globalAlpha = n.a;
        g.fillRect(n.x * w, n.y * h, 1.5, 1.5);
      }
      g.globalAlpha = 1;
      const pts = [];
      for (const s of stars) {
        const px = toPx(s.q, w, h, ROT);
        if (px.x < -10 || px.x > w + 10 || px.y < -10 || px.y > h + 10) continue;
        pts.push({ ...px, s });
        const size = Math.max(2, (7.4 - s.mag) * (w / 520));
        const col = bvColor(s.bv);
        const grd = g.createRadialGradient(px.x, px.y, 0, px.x, px.y, size * 2.2);
        grd.addColorStop(0, `rgba(${col},1)`);
        grd.addColorStop(0.3, `rgba(${col},0.55)`);
        grd.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = grd;
        g.beginPath();
        g.arc(px.x, px.y, size * 2.2, 0, TAU);
        g.fill();
      }
      // paso 2: detección
      const bright = pts.filter((q) => q.s.mag < 4.6).sort((a, b) => a.s.mag - b.s.mag);
      if (p[1] > 0.01) {
        g.strokeStyle = '#62e3b0';
        g.lineWidth = 2;
        g.globalAlpha = p[1];
        const nShow = Math.floor(pts.length * p[1]);
        pts.slice(0, nShow).forEach((q) => {
          g.beginPath();
          g.arc(q.x, q.y, Math.max(6, (6.4 - q.s.mag) * (w / 900) * 2.6), 0, TAU);
          g.stroke();
        });
        g.globalAlpha = 1;
      }
      // paso 3: triángulos con las más brillantes
      if (p[2] > 0.01) {
        g.strokeStyle = cssVar('--accent') || '#8cb4ff';
        g.lineWidth = 2;
        g.globalAlpha = p[2] * (1 - p[3] * 0.85) * 0.9;
        const t = bright.slice(0, 8);
        for (let i = 0; i < t.length; i++) {
          for (let j = i + 1; j < t.length; j++) {
            if (Math.hypot(t[i].x - t[j].x, t[i].y - t[j].y) > w * 0.24) continue;
            g.beginPath();
            g.moveTo(t[i].x, t[i].y);
            g.lineTo(t[j].x, t[j].y);
            g.stroke();
          }
        }
        g.globalAlpha = 1;
      }
      // paso 4: retícula de coordenadas y constelación
      if (p[3] > 0.01) {
        g.globalAlpha = p[3];
        g.strokeStyle = 'rgba(255,187,116,0.55)';
        g.lineWidth = 1.2;
        g.setLineDash([2, 5]);
        for (let ra = 70; ra <= 100; ra += 5) {
          g.beginPath();
          let first = true;
          for (let dec = -25; dec <= 25; dec += 1) {
            const q = project(ra, dec);
            if (!q.ok) continue;
            const px = toPx(q, w, h, ROT);
            first ? g.moveTo(px.x, px.y) : g.lineTo(px.x, px.y);
            first = false;
          }
          g.stroke();
        }
        for (let dec = -20; dec <= 20; dec += 5) {
          g.beginPath();
          let first = true;
          for (let ra = 60; ra <= 110; ra += 1) {
            const q = project(ra, dec);
            if (!q.ok) continue;
            const px = toPx(q, w, h, ROT);
            first ? g.moveTo(px.x, px.y) : g.lineTo(px.x, px.y);
            first = false;
          }
          g.stroke();
        }
        g.setLineDash([]);
        if (ori) {
          g.strokeStyle = 'rgba(140,180,255,0.8)';
          g.lineWidth = 2.2;
          for (const seg of ori.lines) {
            g.beginPath();
            seg.forEach(([ra, dec], i) => {
              const q = project(ra, dec);
              const px = toPx(q, w, h, ROT);
              i ? g.lineTo(px.x, px.y) : g.moveTo(px.x, px.y);
            });
            g.stroke();
          }
        }
        g.fillStyle = '#ffd08a';
        g.font = `600 ${Math.max(12, w * 0.024)}px "Inter Variable", sans-serif`;
        g.fillText('Orión', w * 0.05, h * 0.1);
        g.globalAlpha = 1;
      }
    });

    return {
      step(n) {
        step = n;
        list.forEach((li) => li.classList.toggle('on', +li.dataset.i <= n));
      },
    };
  },
};
