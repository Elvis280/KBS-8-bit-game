const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

// 1. Clean ground_act1_tile.png (remove faux checkerboard from edges)
function cleanTileCheckerboard() {
  const filePath = 'public/assets/tiles/Act_1/ground_act1_tile.png';
  const backupPath = 'public/assets/tiles/Act_1/ground_act1_tile.raw_bak.png';
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }
  const png = PNG.sync.read(fs.readFileSync(backupPath));
  const w = png.width;
  const h = png.height;
  const visited = new Uint8Array(w * h);
  const queue = [];

  function isChecker(r, g, b) {
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    // Checkerboard cells are white (~254) or light grey (~218)
    return maxDiff <= 15 && r >= 190 && g >= 190 && b >= 190;
  }

  // Seed borders
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
      png.data[idx + 3] = 0; // Set transparent
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

  fs.writeFileSync(filePath, PNG.sync.write(png));
  console.log(`Cleaned ground_act1_tile.png: cleared ${cleared} checkerboard pixels (${(cleared/(w*h)*100).toFixed(1)}%) to transparent alpha!`);
}

// 2. Clean ground_act1_seamless.png (remove black background from edges)
function cleanSeamlessBlack() {
  const filePath = 'public/assets/tiles/Act_1/ground_act1_seamless.png';
  const backupPath = 'public/assets/tiles/Act_1/ground_act1_seamless.raw_bak.png';
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }
  const png = PNG.sync.read(fs.readFileSync(backupPath));
  const w = png.width;
  const h = png.height;
  const visited = new Uint8Array(w * h);
  const queue = [];

  function isBlack(r, g, b) {
    return r < 12 && g < 12 && b < 12;
  }

  // Seed borders
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

    if (isBlack(r, g, b)) {
      png.data[idx + 3] = 0; // Set transparent
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

  fs.writeFileSync(filePath, PNG.sync.write(png));
  console.log(`Cleaned ground_act1_seamless.png: cleared ${cleared} black background pixels (${(cleared/(w*h)*100).toFixed(1)}%) to transparent alpha!`);
}

cleanTileCheckerboard();
cleanSeamlessBlack();
