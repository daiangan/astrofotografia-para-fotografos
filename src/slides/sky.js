import { bindRange, bindSegmented, clamp, fitCanvas, setRange, DEG, TAU, cssVar } from '../lib/dom.js';
import { loadSky, bvColor, gmst, altAz, dayOfYear, dayLabel } from '../lib/sky.js';

// Objetos de cielo profundo populares (RA, Dec en grados, J2000)
const DSO = [
  { n: 'M31', ra: 10.68, dec: 41.27 },
  { n: 'M42', ra: 83.82, dec: -5.39 },
  { n: 'M45', ra: 56.87, dec: 24.1 },
  { n: 'M13', ra: 250.42, dec: 36.46 },
  { n: 'M8', ra: 270.92, dec: -24.38 },
  { n: 'M51', ra: 202.47, dec: 47.2 },
  { n: 'NGC 7000', ra: 314.7, dec: 44.3 },
  { n: 'M27', ra: 299.9, dec: 22.72 },
  { n: 'Roseta', ra: 97.98, dec: 4.95 },
  { n: 'M104', ra: 189.99, dec: -11.62 },
];

const PLANETS = [
  { body: 'Venus', color: '#fff2c9', n: 'Venus' },
  { body: 'Jupiter', color: '#ffd9a8', n: 'Júpiter' },
  { body: 'Mars', color: '#ff8a6b', n: 'Marte' },
  { body: 'Saturn', color: '#f2dca4', n: 'Saturno' },
  { body: 'Mercury', color: '#d9d9d9', n: 'Mercurio' },
];

const fmtHour = (h) => {
  const hh = Math.floor(h) % 24;
  const mm = Math.round((h % 1) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`;
};

export default {
  id: 'sky',
  title: 'Planificación: tu cielo',
  tone: 'dark',
  steps: 2,
  html: (cfg) => `
    <div class="sk">
      <div class="sk__left">
        <p class="eyebrow rise">Planificar una sesión</p>
        <h2 class="title rise">Tu cielo, <em>cuando quieras</em></h2>
        <div class="sk__clock rise"><b id="sk-date">20 sep</b><span id="sk-time">22:00</span></div>
        <div class="sk__controls rise" data-interactive>
          <div class="control"><label>Fecha <output id="sk-do">20 sep</output></label>
            <input id="sk-d" type="range" min="0" max="364" step="1" value="262" /></div>
          <div class="control"><label>Hora <output id="sk-ho">22:00</output></label>
            <input id="sk-h" type="range" min="18" max="30" step="0.05" value="22" /></div>
          <div class="sk__row">
            <div class="seg" data-seg-lat></div>
            <div class="seg" data-seg-mode><button data-v="night">▶ Noche</button><button data-v="year">▶ Año</button></div>
          </div>
        </div>
        <p class="tie rise"><b>Herramienta</b> Stellarium (gratis) hace esto, y mucho más.</p>
      </div>
      <div class="sk__dome rise"><canvas id="sk-c"></canvas>
        <div class="sk__phase" id="sk-phase">Noche astronómica</div></div>
    </div>`,
  mount(el, ctx) {
    const view = fitCanvas(el.querySelector('#sk-c'), () => draw());
    const rd = el.querySelector('#sk-d');
    const rh = el.querySelector('#sk-h');
    const now = new Date();
    const year = now.getUTCFullYear();
    const state = { day: dayOfYear(now), hour: 22, lat: ctx.cfg.sky.latitude, mode: 'static' };
    let sky = null;
    let A = null;
    let dirty = true;

    Promise.all([loadSky(), import('astronomy-engine')]).then(([s, mod]) => {
      sky = s;
      A = mod;
      dirty = true;
    });

    // selector de latitud
    const lats = [
      { v: String(ctx.cfg.sky.latitude), label: ctx.cfg.sky.label },
      { v: '45', label: '45° N' },
      { v: '0', label: '0°' },
      { v: '-35', label: '35° S' },
    ].filter((l, i, arr) => arr.findIndex((x) => x.v === l.v) === i);
    const latGroup = el.querySelector('[data-seg-lat]');
    latGroup.innerHTML = lats.map((l) => `<button data-v="${l.v}">${l.label}</button>`).join('');
    const selLat = bindSegmented(latGroup, (v) => {
      state.lat = +v;
      dirty = true;
    });
    selLat(String(state.lat), true);

    const modeGroup = el.querySelector('[data-seg-mode]');
    const selMode = bindSegmented(modeGroup, (v) => setMode(state.mode === v ? 'static' : v));
    function setMode(m) {
      state.mode = m;
      modeGroup.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === m));
      if (m === 'night') state.hour = 18;
      if (m === 'year') {
        state.hour = 23;
        state.day = 0;
      }
      syncUI();
    }

    function syncUI() {
      rd.value = state.day;
      rh.value = state.hour;
      rd.style.setProperty('--pct', `${(state.day / 364) * 100}%`);
      rh.style.setProperty('--pct', `${((state.hour - 18) / 12) * 100}%`);
      el.querySelector('#sk-date').textContent = dayLabel(state.day, year);
      el.querySelector('#sk-do').textContent = dayLabel(state.day, year);
      el.querySelector('#sk-time').textContent = fmtHour(state.hour);
      el.querySelector('#sk-ho').textContent = fmtHour(state.hour);
      dirty = true;
    }
    bindRange(rd, (v) => {
      state.day = v;
      state.mode = 'static';
      modeGroup.querySelectorAll('button').forEach((b) => b.classList.remove('on'));
      syncUI();
    }, { init: false });
    bindRange(rh, (v) => {
      state.hour = v;
      state.mode = 'static';
      modeGroup.querySelectorAll('button').forEach((b) => b.classList.remove('on'));
      syncUI();
    }, { init: false });
    syncUI();

    ctx.loop((dt) => {
      if (state.mode === 'night') {
        state.hour += dt * 0.85;
        if (state.hour > 30) state.hour = 18;
        syncUI();
      } else if (state.mode === 'year') {
        state.day += dt * 22;
        if (state.day > 364) state.day = 0;
        syncUI();
      }
      if (dirty) draw();
    });

    function draw() {
      dirty = false;
      const { ctx: g, w, h } = view;
      if (!w || !sky) return;
      g.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.435;
      const cx = w / 2;
      const cy = h / 2;
      const date = new Date(Date.UTC(year, 0, 1 + Math.floor(state.day), 0, Math.round(state.hour * 60)));
      const lst = gmst(date);
      const lat = state.lat;
      const obs = new A.Observer(lat, 0, 0);

      // Sol: define el color del cielo
      const sunEq = A.Equator(A.Body.Sun, date, obs, true, true);
      const sunHor = A.Horizon(date, obs, sunEq.ra, sunEq.dec, 'normal');
      const sunAlt = sunHor.altitude;
      const dark = clamp((-sunAlt - 4) / 14, 0, 1); // 0 día … 1 noche cerrada
      const twi = clamp((sunAlt + 18) / 18, 0, 1) * (sunAlt < 2 ? 1 : 0);
      el.querySelector('#sk-phase').textContent =
        sunAlt > 0 ? 'Día' : sunAlt > -6 ? 'Crepúsculo civil' : sunAlt > -12 ? 'Crepúsculo náutico' : sunAlt > -18 ? 'Crepúsculo astronómico' : 'Noche astronómica';

      const P = (ra, dec) => {
        const a = altAz(ra, dec, lst, lat);
        const r = (R * (90 - a.alt)) / 90;
        return { x: cx - r * Math.sin(a.az * DEG), y: cy - r * Math.cos(a.az * DEG), alt: a.alt, az: a.az };
      };

      // cielo
      g.save();
      g.beginPath();
      g.arc(cx, cy, R, 0, TAU);
      g.clip();
      const sg = g.createRadialGradient(cx, cy, 0, cx, cy, R);
      const top = mixC([104, 150, 230], [3, 5, 14], dark);
      const hor = mixC([170, 200, 240], [10, 16, 36], dark);
      const glow = mixC([255, 150, 90], hor, 1 - twi * 0.85);
      sg.addColorStop(0, `rgb(${top})`);
      sg.addColorStop(0.7, `rgb(${mixC(top, hor, 0.6)})`);
      sg.addColorStop(1, `rgb(${sunAlt > -18 && sunAlt < 3 ? glow : hor})`);
      g.fillStyle = sg;
      g.fillRect(cx - R, cy - R, R * 2, R * 2);

      const vis = clamp(dark * 1.25, 0, 1); // visibilidad de estrellas

      // Vía Láctea
      if (vis > 0.02) {
        g.save();
        g.filter = `blur(${Math.max(3, R * 0.012)}px)`;
        g.fillStyle = `rgba(190,205,255,${0.052 * vis})`;
        for (const ring of sky.mw) {
          g.beginPath();
          let started = false;
          for (const [ra, dec] of ring) {
            const p = P(ra, dec);
            const rr = Math.hypot(p.x - cx, p.y - cy);
            let { x, y } = p;
            if (p.alt < -10) {
              const k = (R * 1.5) / rr;
              x = cx + (p.x - cx) * k;
              y = cy + (p.y - cy) * k;
            }
            started ? g.lineTo(x, y) : g.moveTo(x, y);
            started = true;
          }
          g.closePath();
          g.fill();
        }
        g.restore();
      }

      // constelaciones
      if (vis > 0.05) {
        g.strokeStyle = `rgba(140,175,255,${0.32 * vis})`;
        g.lineWidth = Math.max(1, w / 900);
        for (const c of sky.cons) {
          for (const seg of c.lines) {
            g.beginPath();
            let pen = false;
            for (const [ra, dec] of seg) {
              const p = P(ra, dec);
              if (p.alt < 0) {
                pen = false;
                continue;
              }
              pen ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y);
              pen = true;
            }
            g.stroke();
          }
        }
      }

      // estrellas
      for (const s of sky.stars) {
        const p = P(s[0], s[1]);
        if (p.alt < 0.5) continue;
        const ext = 1 - Math.min(1, p.alt < 10 ? (10 - p.alt) / 12 : 0); // extinción cerca del horizonte
        const size = Math.max(0.5, (6.4 - s[2]) * (R / 420)) * 1.05;
        const a = clamp((6.4 - s[2]) / 5.2, 0.12, 1) * vis * ext;
        if (a < 0.03) continue;
        const [r, gg, b] = bvColor(s[3]);
        g.fillStyle = `rgba(${r},${gg},${b},${a})`;
        g.beginPath();
        g.arc(p.x, p.y, size, 0, TAU);
        g.fill();
      }

      // objetos de cielo profundo
      g.font = `600 ${Math.max(11, R * 0.04)}px "Inter Variable", sans-serif`;
      for (const o of DSO) {
        const p = P(o.ra, o.dec);
        if (p.alt < 6) continue;
        g.strokeStyle = `rgba(255,187,116,${0.9 * Math.max(vis, 0.2)})`;
        g.lineWidth = 1.5;
        g.beginPath();
        g.arc(p.x, p.y, Math.max(4, R * 0.016), 0, TAU);
        g.stroke();
        g.fillStyle = `rgba(255,208,138,${Math.max(vis, 0.35)})`;
        g.fillText(o.n, p.x + 8, p.y - 6);
      }

      // Luna y planetas
      const moonEq = A.Equator(A.Body.Moon, date, obs, true, true);
      const mp = P(moonEq.ra * 15, moonEq.dec);
      const sp = P(sunEq.ra * 15, sunEq.dec);
      if (mp.alt > -2) drawMoon(g, mp.x, mp.y, Math.max(7, R * 0.032), A.MoonPhase(date), Math.atan2(sp.y - mp.y, sp.x - mp.x));
      g.font = `${Math.max(11, R * 0.036)}px "Inter Variable", sans-serif`;
      for (const pl of PLANETS) {
        try {
          const eq = A.Equator(A.Body[pl.body], date, obs, true, true);
          const p = P(eq.ra * 15, eq.dec);
          if (p.alt < 2) continue;
          g.fillStyle = pl.color;
          g.globalAlpha = Math.max(vis, 0.5);
          g.beginPath();
          g.arc(p.x, p.y, Math.max(3, R * 0.012), 0, TAU);
          g.fill();
          g.fillText(pl.n, p.x + 8, p.y + 4);
          g.globalAlpha = 1;
        } catch (e) {
          /* cuerpo no disponible */
        }
      }
      // Sol
      if (sunAlt > -3) {
        const rr = Math.hypot(sp.x - cx, sp.y - cy);
        if (rr < R * 1.02) {
          g.fillStyle = '#ffe9a8';
          g.shadowColor = '#ffcf6a';
          g.shadowBlur = 24;
          g.beginPath();
          g.arc(sp.x, sp.y, Math.max(8, R * 0.03), 0, TAU);
          g.fill();
          g.shadowBlur = 0;
        }
      }
      g.restore();

      // horizonte y puntos cardinales
      g.strokeStyle = 'rgba(160,190,255,0.45)';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(cx, cy, R, 0, TAU);
      g.stroke();
      g.fillStyle = 'rgba(200,215,255,0.8)';
      g.font = `600 ${Math.max(12, R * 0.055)}px "JetBrains Mono Variable", monospace`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      const off = R * 1.09;
      g.fillText('N', cx, cy - off);
      g.fillText('S', cx, cy + off);
      g.fillText('E', cx - off, cy);
      g.fillText('O', cx + off, cy);
      g.textAlign = 'left';
      g.textBaseline = 'alphabetic';
    }

    window.addEventListener('resize', () => (dirty = true));
    return {
      enter() {
        dirty = true;
      },
      step(n) {
        if (n === 0) {
          if (state.mode !== 'static') {
            state.mode = 'static';
            state.hour = 22;
            state.day = dayOfYear(new Date());
            modeGroup.querySelectorAll('button').forEach((b) => b.classList.remove('on'));
            syncUI();
          }
        } else setMode(n === 1 ? 'night' : 'year');
      },
    };
  },
};

function mixC(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

function drawMoon(g, x, y, rad, elong, toSun) {
  g.save();
  g.translate(x, y);
  g.rotate(toSun);
  g.fillStyle = '#2a3150';
  g.beginPath();
  g.arc(0, 0, rad, 0, TAU);
  g.fill();
  const k = Math.cos(elong * DEG);
  const rx = Math.abs(k) * rad;
  g.fillStyle = '#f4f0e2';
  g.beginPath();
  g.arc(0, 0, rad, -Math.PI / 2, Math.PI / 2, false);
  g.ellipse(0, 0, Math.max(0.01, rx), rad, 0, Math.PI / 2, -Math.PI / 2, k > 0);
  g.closePath();
  g.fill();
  g.restore();
}
