const fs = require('fs');
const { PNG } = require('pngjs');

const dir = 'public/assets/tiles/Act_1';
fs.readdirSync(dir).filter(f => f.endsWith('.png') && !f.includes('raw_bak')).forEach(f => {
  const p = PNG.sync.read(fs.readFileSync(dir + '/' + f));
  let minX = p.width, maxX = 0, minY = p.height, maxY = 0;
  for (let y = 0; y < p.height; y++) {
    for (let x = 0; x < p.width; x++) {
      const a = p.data[(y * p.width + x) * 4 + 3];
      if (a > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Find 50% opacity top grass line (where the solid surface starts)
  let grassTopY = minY;
  for (let y = minY; y <= maxY; y++) {
    let solidCount = 0;
    for (let x = minX; x <= maxX; x++) {
      if (p.data[(y * p.width + x) * 4 + 3] > 180) solidCount++;
    }
    if (solidCount > (maxX - minX + 1) * 0.3) {
      grassTopY = y;
      break;
    }
  }

  console.log(`${f.padEnd(25)} ${String(p.width).padStart(4)}x${String(p.height).padEnd(4)} | Content: X:[${String(minX).padStart(4)}..${String(maxX).padEnd(4)}] Y:[${String(minY).padStart(4)}..${String(maxY).padEnd(4)}] | SolidTopY: ${String(grassTopY).padStart(4)}`);
});
