const fs = require('fs');
const { PNG } = require('pngjs');

const p = PNG.sync.read(fs.readFileSync('public/assets/tiles/Act_1/ground_act1_seamless.png'));
console.log('ground_act1_seamless:', p.width, 'x', p.height);

for (let y = 0; y < p.height; y += 4) {
  let blackCount = 0;
  let grassCount = 0;
  let soilCount = 0;
  let transCount = 0;

  for (let x = 0; x < p.width; x++) {
    const idx = (y * p.width + x) * 4;
    const r = p.data[idx], g = p.data[idx+1], b = p.data[idx+2], a = p.data[idx+3];
    if (a === 0) {
      transCount++;
    } else if (r < 30 && g < 30 && b < 30) {
      blackCount++;
    } else if (g > r && g > b) {
      grassCount++;
    } else {
      soilCount++;
    }
  }

  console.log(`y=${String(y).padStart(3)}: Trans=${String(transCount).padStart(3)} Black=${String(blackCount).padStart(3)} Grass=${String(grassCount).padStart(3)} Soil=${String(soilCount).padStart(3)}`);
}
