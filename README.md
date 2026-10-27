# Astrofotografía para fotógrafos

Presentación web interactiva para dar una charla sobre astrofotografía a un público de fotógrafos. Está pensada para acompañar el discurso: cada slide tiene una idea, un visual grande y muy poco texto.

Son 36 slides que cubren la luz visible, telescopios y lentes, cámaras, filtros, monturas y guiado, accesorios, tipos de astrofotografía, procesado, planificación de una sesión, condiciones del cielo, telescopios inteligentes y cómo empezar. Varias incluyen simulaciones interactivas: espectro electromagnético, cielo real con constelaciones y planetas para cualquier fecha, escala de Bortle, apilado, plate solving, guiado, entre otras.

## Uso

| Acción | Cómo |
|---|---|
| Avanzar / retroceder | `→` `←`, `Espacio`, clic (el borde izquierdo retrocede), swipe en pantallas táctiles |
| Índice de slides | `O` o el botón de la cuadrícula |
| Pantalla completa | `F` o el botón de la esquina |
| Modo claro / oscuro | `T` o el botón del sol |
| Primera / última slide | `Inicio` / `Fin` |

Algunas slides tienen "pasos": cada avance revela el siguiente elemento antes de cambiar de slide. La URL guarda la posición (`#/24.2` es la slide 24, paso 2), así que se puede compartir o retomar.

Los controles se ocultan solos tras unos segundos sin mover el mouse.

## Desarrollo

Requiere Node.js 18 o superior.

```bash
npm install
npm run dev       # servidor local con recarga
npm run build     # genera dist/
npm run preview   # sirve dist/ para probarlo
```

## Personalizar

Los datos del autor viven en [`public/config.json`](public/config.json) y se leen en tiempo de ejecución, así que se pueden cambiar sin recompilar:

```json
{
  "author": {
    "name": "Daian Gan",
    "instagram": "daiangan",
    "website": "daiangan.com",
    "tagline": "Computer Scientist by day, Amateur Astronomer by night."
  },
  "repository": "https://github.com/daiangan/astrofotografia-para-fotografos",
  "sky": { "latitude": 20, "label": "20° N" }
}
```

- `author` alimenta la portada y la slide de contacto (incluido el código QR hacia el sitio web).
- `repository` es el enlace del ícono de GitHub. Si se deja vacío, el ícono no se muestra.
- `sky` es la latitud con la que abre la slide del cielo interactivo.

Las fotos están en `public/img/`. Para reemplazar una, basta con guardar la nueva con el mismo nombre de archivo.

## Estructura

```
src/
  main.js            arranque: fuentes, configuración, motor de slides
  deck.js            navegación, pasos, transiciones, tema, pantalla completa, índice
  lib/               utilidades de canvas, color y cálculo de posiciones del cielo
  slides/            una slide por archivo (más index.js con el orden y las secciones)
  styles/            sistema visual (base.css) y estilos de cada slide (slides.css)
public/
  config.json        datos editables
  data/sky.json      catálogo de estrellas, constelaciones y Vía Láctea
  img/               fotografías
```

Cada slide es un módulo con este formato:

```js
export default {
  id: 'ejemplo',
  title: 'Título para el índice',
  steps: 2,                 // opcional: cantidad de pasos internos
  html: (cfg) => `...`,     // contenido; [data-from="1"] aparece en el paso 1
  mount(el, ctx) { ... },   // opcional: interactividad y animaciones
};
```

Todo el diseño se dibuja sobre un lienzo 16:9 que escala con la ventana (`1rem` = 1/16 del ancho), por lo que los tamaños de texto se mantienen proporcionales en cualquier pantalla o proyector. En pantallas verticales las slides cambian a una disposición en columna.

## Publicación

El sitio es 100 % estático (rutas relativas, sin backend). El flujo incluido en `.github/workflows/deploy.yml` compila y publica en GitHub Pages con cada push a `main`; en los ajustes del repositorio hay que elegir **Pages → Source → GitHub Actions**.

## Créditos

- Posiciones de estrellas, constelaciones y Vía Láctea: proyecto [d3-celestial](https://github.com/ofrohn/d3-celestial) (BSD‑3), a partir del catálogo Hipparcos.
- Posiciones de Sol, Luna y planetas: [astronomy-engine](https://github.com/cosinekitty/astronomy) (MIT).
- Tipografías: Instrument Serif, Inter y JetBrains Mono (SIL Open Font License).
- Fotografías (Wikimedia Commons; los autores conservan sus derechos bajo la licencia indicada):

| Archivo | Autor | Licencia |
|---|---|---|
| `hero.jpg` | ESO / S. Brunier | CC BY 4.0 |
| `pillars.jpg` | NASA, J. Hester y P. Scowen (ASU) | Dominio público |
| `orion.jpg` | NASA, ESA, M. Robberto y el Hubble Space Telescope Orion Treasury Project Team | Dominio público |
| `andromeda.jpg` | Sebas FL | CC BY‑SA 4.0 |
| `earth-night.jpg` | NASA Earth Observatory | Dominio público |
| `jupiter.jpg` | NASA / JPL‑Caltech / SwRI / MSSS, procesada por Kevin M. Gill | Ver la página de origen |
| `moon.jpg` | Gregory H. Revera | CC BY‑SA 3.0 |
| `sun.jpg` | Astrobond | CC BY‑SA 4.0 |
| `milkyway-land.jpg` | CUIZIANG | CC BY 4.0 |
| `rosette.jpg` | Foothillastro | CC BY 4.0 |
| `leo.jpg` | Taavi Niittee | CC BY‑SA 4.0 |
| `m51.jpg` | NASA y ESA | Dominio público |
| `lagoon.jpg` | ESO / IDA / Danish 1.5 m / R. Gendler, U. G. Jørgensen, K. Harpsøe | CC BY 4.0 |
| `ngc7000.jpg` | Lviatour | CC BY‑SA 3.0 |
| `pleiades.jpg` | NASA, ESA, AURA/Caltech, Palomar Observatory | Dominio público |
| `m13.jpg` | Keesscherer | CC BY‑SA 4.0 |
