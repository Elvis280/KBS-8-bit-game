const fs = require('fs');
const { PNG } = require('pngjs');

const b = fs.readFileSync('public/assets/tiles/Act_1/ground_act1_seamless.png');
const png = PNG.sync.read(b);
console.log('ground_act1_seamless.png size:', png.width, png.height);

for (let y = 0; y < png.height; y += 40) {
  const samples = [];
  for (let x = 0; x < png.width; x += Math.floor(png.width / 5)) {
    const idx = (y * png.width + x) * 4;
    samples.push(`(${png.data[idx]},${png.data[idx+1]},${png.data[idx+2]})`);
  }
  console.log(`y=${String(y).padStart(4)}: ${samples.join(' ')}`);
}
