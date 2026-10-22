const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

function cleanCheckerboardBuilding(filename) {
  const fullPath = path.join('public/assets/props', filename);
  if (!fs.existsSync(fullPath)) return;
  const png = PNG.sync.read(fs.readFileSync(fullPath));
  const w = png.width;
  const h = png.height;
  const visited = new Uint8Array(w * h);
  const queue = [];

  function isChecker(r, g, b) {
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    return maxDiff <= 15 && r >= 190 && g >= 190 && b >= 190;
  }

  // Seed all 4 borders
  for (let x = 0; x < w; x++) {
    queue.push(x, 0);
    queue.push(x, h - 1);
    visited[x] = 1;
    visited[(h - 1) * w + x] = 1;
  }
  for (let y = 0; y < h; y++) {
    queue.push(0, y);
    queue.push(w - 1, y);
    visited[y * w] = 1;
    visited[y * w + (w - 1)] = 1;
  }

  let head = 0;
  let cleared = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    const idx = (y * w + x) * 4;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];

    if (isChecker(r, g, b)) {
      png.data[idx + 3] = 0; // Pure transparent!
      cleared++;

      const neighbors = [
        [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
      ];
      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const npos = ny * w + nx;
          if (!visited[npos]) {
            visited[npos] = 1;
            queue.push(nx, ny);
          }
        }
      }
    }
  }

  if (cleared > 0) {
    console.log(`Cleaned ${filename}: cleared ${cleared} checkerboard pixels (${(cleared/(w*h)*100).toFixed(1)}%)!`);
    fs.writeFileSync(fullPath, PNG.sync.write(png));
  }
}

[
  'bldg-act1-cottage.png',
  'bldg_act2_crypt.png',
  'bldg-act3-temple.png',
  'bldg_act4_bastion.png',
  'bldg_act5_voidsphere.png'
].forEach(cleanCheckerboardBuilding);
