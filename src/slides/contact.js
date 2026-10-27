import qrcode from 'qrcode-generator';

export default {
  id: 'contact',
  title: 'Contacto',
  tone: 'dark',
  steps: 0,
  html: (cfg) => {
    const a = cfg.author;
    const url = a.website ? (a.website.startsWith('http') ? a.website : `https://${a.website}`) : '';
    let qr = '';
    if (url) {
      const q = qrcode(0, 'M');
      q.addData(url);
      q.make();
      qr = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    }
    return `
      <div class="ct">
        <div class="ct__main">
          <p class="eyebrow rise">Gracias</p>
          <h2 class="title title--lg rise">${a.name}</h2>
          <p class="ct__tag rise">${a.tagline}</p>
          <ul class="ct__links rise">
            ${a.instagram ? `<li><span>Instagram</span><b>@${a.instagram}</b></li>` : ''}
            ${a.website ? `<li><span>Web</span><b>${a.website}</b></li>` : ''}
          </ul>
        </div>
        ${qr ? `<div class="ct__qr rise">${qr}<span>${a.website}</span></div>` : ''}
      </div>`;
  },
};
