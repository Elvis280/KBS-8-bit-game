const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const dir = 'public/assets/tiles/Act_1';
const files = [
  'platform_act1_1.png',
  'platform_act1_2.png',
  'ground_act1_seamless.png',
  'ground_act1_tile.png'
];

files.forEach(file => {
  const buf = fs.readFileSync(path.join(dir, file));
  const png = PNG.sync.read(buf);
  console.log(`\n=== Analyzing ${file} (${png.width}x${png.height}) ===`);

  // Count alphas
  let transparentCount = 0;
  let semiCount = 0;
  let opaqueCount = 0;
  let total = png.width * png.height;

  for (let i = 0; i < png.data.length; i += 4) {
    const a = png.data[i + 3];
    if (a === 0) transparentCount++;
    else if (a < 250) semiCount++;
    else opaqueCount++;
  }

  console.log(`Alpha breakdown: Transparent=${(transparentCount/total*100).toFixed(1)}%, Semi=${(semiCount/total*100).toFixed(1)}%, Opaque=${(opaqueCount/total*100).toFixed(1)}%`);

  // Sample corner pixels (0,0), (w-1, 0), (w/2, 0)
  function getPixel(x, y) {
    const idx = (y * png.width + x) * 4;
    return `RGBA(${png.data[idx]}, ${png.data[idx+1]}, ${png.data[idx+2]}, ${png.data[idx+3]})`;
  }

  console.log(`Pixel (0,0): ${getPixel(0, 0)}`);
  console.log(`Pixel (mid,0): ${getPixel(Math.floor(png.width / 2), 0)}`);
  console.log(`Pixel (mid, mid): ${getPixel(Math.floor(png.width / 2), Math.floor(png.height / 2))}`);
  console.log(`Pixel (mid, h-1): ${getPixel(Math.floor(png.width / 2), png.height - 1)}`);
});
