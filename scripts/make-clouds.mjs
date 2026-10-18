// Generates soft, transparent cloud images (src/assets/clouds/*.png).
// Each cloud is hundreds of small sphere-shaded puffs, painted back to front, which is
// roughly how a cumulus looks: lots of lit, round bumps with soft shadowed undersides.
// Run with: node scripts/make-clouds.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Light comes from above and slightly in front of the cloud.
const L = (() => {
  const v = [-0.25, -0.85, 0.55];
  const n = Math.hypot(...v);
  return v.map((c) => c / n);
})();

const LIT = [255, 255, 255];
const SHADE = [150, 140, 204]; // lavender shadows, to sit in a purple sky

function render({ name, width, height, seed, blobs, puffs, rMin, rMax, flatBase = 0.8, softness = 1, opacity = 0.92 }) {
  const rand = rng(seed);
  const shape = (u, v) => {
    let s = 0;
    for (const [bx, by, rx, ry, w = 1] of blobs) {
      const dx = (u - bx) / rx;
      const dy = (v - by) / ry;
      s += w * Math.exp(-(dx * dx + dy * dy) * 2);
    }
    // Flatter bottoms.
    return s * (1 - smooth(flatBase, 1, v));
  };

  // Scatter puffs inside the shape; bigger ones where the cloud is thickest.
  const list = [];
  while (list.length < puffs) {
    const u = rand();
    const v = rand();
    const s = shape(u, v);
    if (rand() > s) continue;
    const r = (rMin + (rMax - rMin) * Math.pow(rand(), 1.3) * Math.min(1, s)) * height;
    list.push({ x: u * width, y: v * height, r, z: v + rand() * 0.35, s, a: 1 });
  }
  // Paint from the top/back down to the front, so lower puffs overlap the ones behind them.
  list.sort((a, b) => a.z - b.z);

  const C = new Float32Array(width * height * 3);
  const A = new Float32Array(width * height);

  for (const p of list) {
    const x0 = Math.max(0, Math.floor(p.x - p.r));
    const x1 = Math.min(width - 1, Math.ceil(p.x + p.r));
    const y0 = Math.max(0, Math.floor(p.y - p.r));
    const y1 = Math.min(height - 1, Math.ceil(p.y + p.r));
    // Puffs low in the cloud and at its thin edges are dimmer.
    const depthShade = 1 - 0.5 * smooth(0.22, 0.95, p.y / height);
    const edgeFade = smooth(0.05, 0.5, p.s);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = (x - p.x) / p.r;
        const dy = (y - p.y) / p.r;
        const d2 = dx * dx + dy * dy;
        if (d2 >= 1) continue;
        const nz = Math.sqrt(1 - d2);
        const diffuse = Math.max(0, dx * L[0] + dy * L[1] + nz * L[2]);
        const light = Math.min(1, (0.22 + 0.95 * diffuse) * depthShade + 0.08);
        const a = Math.pow(1 - d2, 1.6 * softness) * 0.85 * edgeFade * p.a;
        const i = y * width + x;
        const keep = 1 - a;
        for (let c = 0; c < 3; c++) {
          const col = SHADE[c] + (LIT[c] - SHADE[c]) * light;
          C[i * 3 + c] = col * a + C[i * 3 + c] * keep;
        }
        A[i] = a + A[i] * keep;
      }
    }
  }

  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const a = A[i];
    if (a <= 0.001) continue;
    // C is premultiplied; un-premultiply for PNG.
    for (let c = 0; c < 3; c++) out[i * 4 + c] = Math.min(255, Math.round(C[i * 3 + c] / a));
    out[i * 4 + 3] = Math.round(255 * Math.min(1, a * opacity));
  }
  return sharp(out, { raw: { width, height, channels: 4 } })
    .blur(1.1)
    .png({ compressionLevel: 9 })
    .toFile(`src/assets/clouds/${name}.png`);
}

function smooth(a, b, v) {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

await mkdir('src/assets/clouds', { recursive: true });

await render({
  name: 'bank-left',
  width: 1600,
  height: 700,
  seed: 11,
  puffs: 1400,
  rMin: 0.03,
  rMax: 0.19,
  blobs: [
    [0.14, 0.64, 0.17, 0.22],
    [0.33, 0.55, 0.17, 0.28, 1.2],
    [0.53, 0.62, 0.17, 0.22],
    [0.71, 0.68, 0.14, 0.17, 0.85],
    [0.86, 0.73, 0.1, 0.12, 0.6],
    [0.4, 0.38, 0.1, 0.15, 0.8],
  ],
});

await render({
  name: 'bank-right',
  width: 1600,
  height: 700,
  seed: 29,
  puffs: 1400,
  rMin: 0.03,
  rMax: 0.19,
  blobs: [
    [0.86, 0.63, 0.17, 0.23],
    [0.66, 0.54, 0.17, 0.28, 1.2],
    [0.47, 0.63, 0.16, 0.21],
    [0.29, 0.69, 0.14, 0.16, 0.85],
    [0.14, 0.74, 0.1, 0.11, 0.6],
    [0.6, 0.37, 0.1, 0.15, 0.8],
  ],
});

await render({
  name: 'puff',
  width: 1000,
  height: 640,
  seed: 5,
  puffs: 700,
  rMin: 0.04,
  rMax: 0.17,
  blobs: [
    [0.5, 0.58, 0.22, 0.26, 1.2],
    [0.32, 0.66, 0.16, 0.17],
    [0.68, 0.64, 0.16, 0.18],
    [0.48, 0.38, 0.12, 0.15, 0.8],
  ],
});

console.log('Wrote src/assets/clouds/{bank-left,bank-right,puff}.png');
