const sharp = require('sharp');
// The HuzaEstate mark as a house: a solid pitched-roof house with the three bars cut out of it
// (the right bar split by its small gap, the short middle bar as the door). Same bars, now inside a house.
const mark = (s, ox, oy, fill, cut) => `<g transform="translate(${ox} ${oy}) scale(${s})">
<polygon points="18.5,-6 36,11 36,41 1,41 1,11" fill="${fill}" stroke="${fill}" stroke-width="2" stroke-linejoin="round"/>
<g stroke="${cut}" stroke-width="5" fill="none"><line x1="9.5" y1="14" x2="9.5" y2="36"/><line x1="27.5" y1="14" x2="27.5" y2="29"/><line x1="27.5" y1="31" x2="27.5" y2="36"/><line x1="18.5" y1="21" x2="18.5" y2="29"/></g></g>`;
const word = (x, y, size, anchor, dark, green) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="800" letter-spacing="-1"><tspan fill="${dark}">Huza</tspan><tspan fill="${green}">Estate</tspan></text>`;
const bars = (s, ox, oy, c) => `<g transform="translate(${ox} ${oy}) scale(${s})" stroke="${c}" stroke-width="5" fill="none"><line x1="9.5" y1="6" x2="9.5" y2="33"/><line x1="27.5" y1="6" x2="27.5" y2="26"/><line x1="27.5" y1="28" x2="27.5" y2="33"/><line x1="18.5" y1="13" x2="18.5" y2="23"/></g>`;
const profileBars = (bg, c, dark, green) => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="800" height="800" fill="${bg}"/>${bars(14, 400 - 18.5 * 14, 335 - 19.5 * 14, c)}${word(400, 640, 76, 'middle', dark, green)}</svg>`;
const profile = (bg, fill, dark, green) => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="800" height="800" fill="${bg}"/>${mark(10, 400 - 18.5 * 10, 175, fill, bg)}${word(400, 690, 76, 'middle', dark, green)}</svg>`;
const header = `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500"><rect width="1500" height="500" fill="#ffffff"/>${bars(8, 300 - 18.5 * 8, 250 - 19.5 * 8, '#2ec440')}${word(455, 300, 170, 'start', '#111827', '#2ec440')}</svg>`;
(async () => {
  await sharp(Buffer.from(profileBars('#ffffff', '#2ec440', '#111827', '#2ec440'))).resize(400, 400).png().toFile('huzaestate-x-profile-400.png');
  await sharp(Buffer.from(profileBars('#2ec440', '#ffffff', '#ffffff', '#ffffff'))).resize(400, 400).png().toFile('huzaestate-x-profile-green-400.png');
  await sharp(Buffer.from(header)).png().toFile('huzaestate-x-header-1500x500.png');
})();
