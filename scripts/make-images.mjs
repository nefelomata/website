// Regenerates the PNG icons and the social share card (public/og.jpg).
// Run with: node scripts/make-images.mjs
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const svg = await readFile('public/favicon.svg');
await sharp(svg, { density: 384 }).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(svg, { density: 384 }).resize(32, 32).png().toFile('public/favicon-32.png');

const W = 1200;
const H = 630;
const portrait = await sharp('src/assets/portrait.jpg')
  .resize(460, 575, { fit: 'cover', position: 'centre' })
  .composite([
    {
      input: Buffer.from(
        `<svg width="460" height="575"><rect width="460" height="575" rx="22" ry="22"/></svg>`,
      ),
      blend: 'dest-in',
    },
  ])
  .png()
  .toBuffer();

const text = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .mono { font: 600 17px 'Cascadia Mono', Consolas, 'DejaVu Sans Mono', monospace; letter-spacing: 2px; fill: #c6c1d4; }
    .name { font: 700 96px 'Segoe UI', Inter, Arial, sans-serif; letter-spacing: -4px; fill: #f2f0f7; }
    .lede { font: 400 30px 'Segoe UI', Inter, Arial, sans-serif; fill: #e2ddf2; }
    .em { font: 600 30px 'Segoe UI', Inter, Arial, sans-serif; fill: #ffffff; }
  </style>
  <rect x="62" y="70" width="12" height="12" fill="#8f7bff"/>
  <text x="88" y="82" class="mono">SC.01  OPENING TITLES</text>
  <text x="56" y="250" class="name">Nefeli</text>
  <text x="56" y="345" class="name">Koumantaki</text>
  <text x="62" y="430" class="lede">Film production · Copywriting · Athens</text>
  <text x="62" y="478" class="em">On schedule. On budget. Everyone fed.</text>
  <text x="62" y="568" class="mono">MCCANN · DDB · FLEXCAR · INTERSPORT · FILM SCHOOL</text>
  <g fill="none" stroke="#f2f0f7" stroke-width="3">
    <path d="M676 36v-22h22M1146 14h22v22M1168 594v22h-22M698 616h-22v-22"/>
  </g>
  <circle cx="722" cy="62" r="6" fill="#ff3b30"/>
  <text x="736" y="68" class="mono" style="fill:#fff">REC</text>
</svg>`;

const sky = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0b0a10"/><stop offset=".55" stop-color="#1a1450"/><stop offset="1" stop-color="#3a2bb0"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
</svg>`);
const cloudLeft = await sharp('src/assets/clouds/bank-left.png').resize(1100).toBuffer();
const cloudPuff = await sharp('src/assets/clouds/puff.png').resize(520).blur(6).toBuffer();

await sharp(sky)
  .composite([
    { input: cloudLeft, left: -320, top: 470 },
    { input: cloudPuff, left: 700, top: 470 },
    { input: portrait, left: W - 460 - 48, top: 28 },
    { input: Buffer.from(text), left: 0, top: 0 },
  ])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile('public/og.jpg');

console.log('Wrote public/apple-touch-icon.png, public/favicon-32.png, public/og.jpg');
