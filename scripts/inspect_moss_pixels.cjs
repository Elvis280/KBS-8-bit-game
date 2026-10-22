const fs = require('fs');
const { PNG } = require('pngjs');

const p = PNG.sync.read(fs.readFileSync('public/assets/tiles/Act_1/platform_act1_moss.png'));
console.log('platform_act1_moss.png dimensions:', p.width, p.height);

// Find what colors exist where alpha > 0 outside the main platform body
// Main platform body is roughly in the center-bottom
for (let y = 0; y < 30; y += 5) {
  let samples = [];
  for (let x = 0; x < p.width; x += 30) {
    const idx = (y * p.width + x) * 4;
    samples.push(`[${x},${y}]:A=${p.data[idx+3]} (${p.data[idx]},${p.data[idx+1]},${p.data[idx+2]})`);
  }
  console.log(samples.join(' '));
}
