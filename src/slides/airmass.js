import { bindRange, bindSegmented, fitCanvas, rng, TAU, DEG, clamp, cssVar } from '../lib/dom.js';

const airmass = (alt) => 1 / (Math.sin(alt * DEG) + 0.50572 * Math.pow(alt + 6.07995, -1.6364));

export default {
  id: 'airmass',
  title: 'Transparencia atmosférica',
  steps: 1,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Condiciones del cielo · transparencia</p>
      <h2 class="title rise">Mira por lo <em>más delgado</em></h2>
    </div>
    <div class="am2 grow">
      <div class="canvas-box am2__c rise"><canvas id="am2-c"></canvas></div>
      <div class="am2__side rise" data-interactive>
        <div class="am2__big"><b id="am2-x">×1.0</b><span>de atmósfera</span></div>
        <div class="am2__big am2__big--light"><b id="am2-l">82 %</b><span>de su luz llega</span></div>
        <div class="control"><label>Altura de la estrella <output id="am2-o">90°</output></label>
          <input id="am2-r" type="range" min="10" max="90" step="1" value="90" /></div>
        <div class="seg" data-seg><button data-v="clear" class="on">Aire limpio</button><button data-v="haze">Bruma o polvo</button></div>
      </div>
    </div>`,
  mount(el, ctx) {
    const view = fitCanvas(el.querySelector('#am2-c'), () => draw());
    const range = el.querySelector('#am2-r');
    let alt = 90;
    let haze = 0;
    const r = rng(8);
    const dust = Array.from({ length: 160 }, () => ({ x: r(), y: r(), s: 0.6 + r() * 1.8, v: 0.2 + r() * 0.6 }));
    let t = 0;

    function draw() {
      const { ctx: g, w, h } = view;
      if (!w) return;
      g.clearRect(0, 0, w, h);
      const Re = Math.min(w, h) * 2.4;
      const th = Math.min(w, h) * 0.2; // atmósfera (exagerada)
      const ox = w * 0.28;
      const oy = h * 0.9;
      const ex = ox;
      const ey = oy + Re; // centro de la Tierra
      // atmósfera
      const atm = g.createRadialGradient(ex, ey, Re, ex, ey, Re + th);
      atm.addColorStop(0, haze ? 'rgba(210,180,140,0.55)' : 'rgba(110,160,255,0.5)');
      atm.addColorStop(1, 'rgba(60,90,200,0)');
      g.fillStyle = atm;
      g.beginPath();
      g.arc(ex, ey, Re + th, 0, TAU);
      g.fill();
      // Tierra
      g.fillStyle = '#0b1226';
      g.beginPath();
      g.arc(ex, ey, Re, 0, TAU);
      g.fill();
      g.strokeStyle = 'rgba(140,180,255,0.5)';
      g.lineWidth = 2;
      g.stroke();
      // polvo
      if (haze) {
        g.fillStyle = 'rgba(230,200,150,0.55)';
        for (const p of dust) {
          const x = (p.x + t * 0.01 * p.v) % 1;
          const y = oy - th * (0.05 + p.y * 0.95) - Math.abs((x - 0.28)) * 0 ;
          g.beginPath();
          g.arc(x * w, y - (p.y * 0.0), p.s, 0, TAU);
          g.fill();
        }
      }
      // rayo hacia la estrella
      const dx = Math.cos(alt * DEG);
      const dy = -Math.sin(alt * DEG);
      // intersección con la esfera exterior
      const px = ox - ex;
      const py = oy - ey;
      const b = px * dx + py * dy;
      const c = px * px + py * py - (Re + th) ** 2;
      const s = -b + Math.sqrt(b * b - c);
      const hx = ox + dx * s;
      const hy = oy + dy * s;
      // otras direcciones tenues
      g.strokeStyle = 'rgba(255,255,255,0.08)';
      g.lineWidth = 1;
      for (const a of [20, 40, 60, 90]) {
        g.beginPath();
        g.moveTo(ox, oy);
        g.lineTo(ox + Math.cos(a * DEG) * w, oy - Math.sin(a * DEG) * w);
        g.stroke();
      }
      const far = Math.max(w, h) * 1.4;
      const sx = clamp(ox + dx * (s + h * 0.35), 0, w * 0.96);
      const sy = clamp(oy + dy * (s + h * 0.35), h * 0.06, h);
      // el tramo por la atmósfera
      g.strokeStyle = haze ? '#f2c07a' : '#8cb4ff';
      g.lineWidth = 6;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(ox, oy);
      g.lineTo(hx, hy);
      g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.4)';
      g.lineWidth = 2;
      g.setLineDash([6, 8]);
      g.beginPath();
      g.moveTo(hx, hy);
      g.lineTo(ox + dx * far, oy + dy * far);
      g.stroke();
      g.setLineDash([]);
      // estrella al final del rayo
      const X = airmass(alt);
      const k = haze ? 0.48 : 0.2;
      const flux = Math.pow(10, -0.4 * k * X);
      const starX = clamp(ox + dx * (s + Math.min(w, h) * 0.5), 0, w * 0.95);
      const starY = clamp(oy + dy * (s + Math.min(w, h) * 0.5), h * 0.07, h);
      const red = clamp((X - 1) / 6, 0, 1);
      const col = `rgb(255,${Math.round(255 - red * 80)},${Math.round(255 - red * 150)})`;
      const rad = 16 + 18 * flux;
      const sg = g.createRadialGradient(starX, starY, 0, starX, starY, rad * 2.2);
      sg.addColorStop(0, col);
      sg.addColorStop(0.25, col.replace('rgb', 'rgba').replace(')', `,${0.6 * flux + 0.1})`));
      sg.addColorStop(1, 'rgba(255,220,180,0)');
      g.globalAlpha = 0.25 + 0.75 * flux;
      g.fillStyle = sg;
      g.beginPath();
      g.arc(starX, starY, rad * 2.2, 0, TAU);
      g.fill();
      g.globalAlpha = 1;
      // observador
      g.fillStyle = '#ffbb74';
      g.beginPath();
      g.arc(ox, oy, 8, 0, TAU);
      g.fill();
      el.querySelector('#am2-x').textContent = `×${X.toFixed(X < 10 ? 1 : 0)}`;
      el.querySelector('#am2-l').textContent = `${Math.round(flux * 100)} %`;
      el.querySelector('#am2-o').textContent = `${alt}°`;
    }

    bindRange(range, (v) => {
      alt = v;
      draw();
    });
    const sel = bindSegmented(el.querySelector('[data-seg]'), (v) => {
      haze = v === 'haze' ? 1 : 0;
      draw();
    });
    ctx.loop((dt) => {
      if (haze) {
        t += dt * 6;
        draw();
      }
    });
    return {
      step(n) {
        sel(n ? 'haze' : 'clear', false);
      },
    };
  },
};
