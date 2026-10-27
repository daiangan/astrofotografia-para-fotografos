import { fitCanvas, gauss, imagePixels, loadImage, rng, tween, clamp } from '../lib/dom.js';

const PARTS = ['Telescopio', 'Cámara', 'Montura', 'Guiado', 'Enfocador', 'Computadora', 'Filtro', 'Cables'];

export const smartProblem = {
  id: 'smart-problem',
  title: 'Telescopios inteligentes: el problema',
  steps: 1,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Telescopios inteligentes</p>
      <h2 class="title rise">Todo el equipo, <em>en una sola caja</em></h2>
    </div>
    <div class="sp grow">
      <div class="sp__stage rise">
        <div class="sp__parts">
          ${PARTS.map((p, i) => `<span class="sp__p" style="--i:${i};--dy:${i % 2 ? 1 : -1}">${p}</span>`).join('')}
        </div>
        <div class="sp__device">
          <svg viewBox="0 0 200 260" aria-hidden="true">
            <rect class="hw" x="70" y="30" width="60" height="140" rx="26" />
            <circle cx="100" cy="62" r="20" class="glass" />
            <circle cx="100" cy="62" r="9" fill="var(--accent)" opacity=".6" />
            <path class="tube" d="M70 200 h60 M100 170 v30" />
            <rect class="hw" x="50" y="200" width="100" height="26" rx="9" />
            <circle cx="100" cy="213" r="4" class="dot" />
          </svg>
        </div>
      </div>
    </div>`,
  mount(el) {
    return {
      step(n) {
        el.querySelector('.sp__stage').classList.toggle('merged', n >= 1);
      },
    };
  },
};

const HOW = [
  { t: 'Se ubica', s: 'Fotografía el cielo y resuelve dónde está (plate solving).' },
  { t: 'Apunta', s: 'Su montura altazimutal va al objeto que elegiste.' },
  { t: 'Sigue', s: 'Compensa el giro del cielo, incluida la rotación de campo.' },
  { t: 'Apila', s: 'Suma tomas en vivo: la imagen mejora cada segundo.' },
];

export const smartHow = {
  id: 'smart-how',
  title: 'Telescopios inteligentes: cómo funcionan',
  steps: 4,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Telescopios inteligentes · cómo funcionan</p>
      <h2 class="title rise">Cuatro pasos, <em>cero cables</em></h2>
    </div>
    <div class="sh grow">
      <ol class="sh__steps rise">
        ${HOW.map((h, i) => `<li data-i="${i + 1}"><i>${i + 1}</i><div><b>${h.t}</b><span>${h.s}</span></div></li>`).join('')}
      </ol>
      <div class="canvas-box sh__live rise"><canvas id="sh-c"></canvas><span class="sh__tag" id="sh-tag">Imagen en vivo</span></div>
    </div>`,
  mount(el, ctx) {
    const view = fitCanvas(el.querySelector('#sh-c'), () => draw());
    const items = Array.from(el.querySelectorAll('.sh__steps li'));
    const W = 640;
    const H = 420;
    let base = null;
    let noise = null;
    let out = null;
    let off = null;
    let frames = 1;
    let target = 1;
    let step = 0;

    loadImage('m51').then((img) => {
      base = imagePixels(img, W, H, 0.5, 0.5, 1.1);
      const r = rng(2);
      noise = new Float32Array(W * H * 3);
      for (let i = 0; i < noise.length; i++) noise[i] = gauss(r);
      out = new ImageData(W, H);
      off = document.createElement('canvas');
      off.width = W;
      off.height = H;
      draw();
    });

    function draw() {
      if (!base || !view.w) return;
      const dim = step >= 1 ? 1 : 0.15; // antes de ubicarse, la cámara aún no "ve" el objeto
      const sigma = 85 / Math.sqrt(frames);
      const s = base.data;
      const d = out.data;
      for (let i = 0, k = 0; i < s.length; i += 4, k += 3) {
        d[i] = s[i] * 0.8 * dim + noise[k] * sigma + 6;
        d[i + 1] = s[i + 1] * 0.8 * dim + noise[k + 1] * sigma + 6;
        d[i + 2] = s[i + 2] * 0.8 * dim + noise[k + 2] * sigma + 6;
        d[i + 3] = 255;
      }
      off.getContext('2d').putImageData(out, 0, 0);
      view.ctx.drawImage(off, 0, 0, view.w, view.h);
      el.querySelector('#sh-tag').textContent = step >= 4 ? `Apilando · ${Math.round(frames)} tomas` : 'Imagen en vivo';
    }

    let stop = null;
    return {
      step(n, info) {
        step = n;
        items.forEach((li) => li.classList.toggle('on', +li.dataset.i <= n));
        if (stop) stop();
        if (n >= 4) {
          stop = tween(1, 120, info.initial ? 1 : 6000, (v) => {
            frames = v;
            draw();
          }, (t) => t * t);
        } else {
          frames = 1;
          draw();
        }
      },
    };
  },
};

const PROS = ['Listos en minutos', 'Sin cables ni computadora', 'Ligeros y portátiles', 'Cielo profundo desde el patio'];
const CONS = ['Apertura pequeña (30–50 mm)', 'No cambias óptica ni cámara', 'Menos control del proceso', 'Campo fijo'];

export const smartPros = {
  id: 'smart-pros',
  title: 'Telescopios inteligentes: ventajas y marcas',
  steps: 2,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Telescopios inteligentes</p>
      <h2 class="title rise">Ideales para <em>empezar</em></h2>
    </div>
    <div class="spr grow">
      <div class="spr__col spr__col--pro rise">
        <h3>Ventajas</h3>
        <ul>${PROS.map((p) => `<li>${p}</li>`).join('')}</ul>
      </div>
      <div class="spr__col spr__col--con" data-from="1">
        <h3>Límites</h3>
        <ul>${CONS.map((p) => `<li>${p}</li>`).join('')}</ul>
      </div>
      <div class="spr__brands" data-from="2">
        <div class="spr__b"><b>Seestar</b><span>ZWO · S30 · S30 Pro · S50</span></div>
        <div class="spr__b"><b>Dwarf</b><span>DwarfLab · Dwarf 3 · Mini</span></div>
        <div class="spr__b spr__b--more"><span>También: Vaonis · Unistellar</span></div>
      </div>
    </div>`,
};
