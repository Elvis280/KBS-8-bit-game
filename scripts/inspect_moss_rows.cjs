const fs = require('fs');
const { PNG } = require('pngjs');

const p = PNG.sync.read(fs.readFileSync('public/assets/tiles/Act_1/platform_act1_moss.png'));

// Flood fill from all 4 borders to find the true outer background!
// In transparent PNGs, the background is connected to the outer perimeter.
// Any near-black or dark pixels (R < 35, G < 35, B < 35) or low-alpha pixels connected to borders
// are background noise or black matte!
const w = p.width;
const h = p.height;
console.log('platform_act1_moss:', w, 'x', h);

// Let's inspect rows 0 to 30:
for (let y = 0; y < 25; y++) {
  let count = 0;
  for (let x = 0; x < w; x++) {
    if (p.data[(y * w + x) * 4 + 3] > 20) count++;
  }
  if (count > 0) {
    console.log(`y=${y}: solid pixels = ${count} / ${w}`);
  }
}
