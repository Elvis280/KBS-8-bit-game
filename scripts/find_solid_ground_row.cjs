const fs = require('fs');
const { PNG } = require('pngjs');

const p = PNG.sync.read(fs.readFileSync('public/assets/tiles/Act_1/ground_act1_seamless.png'));
console.log('ground_act1_seamless size:', p.width, 'x', p.height);

// Find row where opacity is > 90% across the whole width
let solidGroundY = -1;
for (let y = 0; y < p.height; y++) {
  let opaqueCount = 0;
  for (let x = 0; x < p.width; x++) {
    const a = p.data[(y * p.width + x) * 4 + 3];
    if (a > 220) opaqueCount++;
  }
  const pct = (opaqueCount / p.width) * 100;
  if (pct >= 85 && solidGroundY === -1) {
    solidGroundY = y;
  }
  if (y <= 45 && y % 3 === 0) {
    console.log(`y=${String(y).padStart(2)}: opaque = ${String(opaqueCount).padStart(3)} / ${p.width} (${pct.toFixed(1)}%)`);
  }
}

console.log(`\n=> First row with >= 85% solid ground: y = ${solidGroundY}`);
