const fs = require('fs');
const { PNG } = require('pngjs');

const b = fs.readFileSync('public/assets/tiles/Act_1/ground_act1_tile.png');
const png = PNG.sync.read(b);
console.log('ground_act1_tile.png size:', png.width, png.height);

// Sample rows every 50 pixels
for (let y = 0; y < png.height; y += 50) {
  const samples = [];
  for (let x = 0; x < png.width; x += Math.floor(png.width / 5)) {
    const idx = (y * png.width + x) * 4;
    samples.push(`(${png.data[idx]},${png.data[idx+1]},${png.data[idx+2]})`);
  }
  console.log(`y=${String(y).padStart(4)}: ${samples.join(' ')}`);
}
