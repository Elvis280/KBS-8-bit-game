const fs = require('fs');
const { PNG } = require('pngjs');

// 1. Clean ground_act1_seamless.png: remove black background from top
function cleanSeamlessGround() {
  const file = 'public/assets/tiles/Act_1/ground_act1_seamless.png';
  const png = PNG.sync.read(fs.readFileSync(file));
  const w = png.width;
  const h = png.height;
  const visited = new Uint8Array(w * h);
  const queue = [];

  // Seed top row (y = 0) and bottom row (y = h - 1)
  for (let x = 0; x < w; x++) {
    queue.push(x, 0);
    visited[x] = 1;
  }

  function isBackground(r, g, b, a) {
    // Top background is black or very dark (r<55, g<55, b<55)
    // Grass is distinctly green: g > r && g > b && g >= 45
    // Soil is brown: r > b && r >= 50
    const isDark = (r < 55 && g < 55 && b < 55);
    const isGrass = (g > r + 10 && g > b + 10 && g >= 50);
    const isSoil = (r > b + 15 && r >= 50);
    return isDark && !isGrass && !isSoil;
  }

  let cleared = 0;
  let head = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    const idx = (y * w + x) * 4;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    const a = png.data[idx + 3];

    if (isBackground(r, g, b, a)) {
      png.data[idx + 3] = 0; // Set pure transparent!
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

  console.log(`Cleaned ground_act1_seamless: cleared ${cleared} black background pixels to transparent!`);
  fs.writeFileSync(file, PNG.sync.write(png));
  fs.writeFileSync('public/assets/tiles/ground_act1_seamless.png', PNG.sync.write(png));
}

// 2. Clean platform_act1_moss.png: remove rogue stray pixels in top/corner
function cleanPlatformMoss() {
  const file = 'public/assets/tiles/Act_1/platform_act1_moss.png';
  const png = PNG.sync.read(fs.readFileSync(file));
  const w = png.width;
  const h = png.height;

  // Clear rogue top-left artifact (y < 25, x < 25) and top-right (y < 25, x > w - 30)
  let cleared = 0;
  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < w; x++) {
      // The true platform moss surface is in the center, starting around y >= 32
      // Any pixels in y < 28 near the corners or floating at the very top are stray artifacts
      if (y < 12 || (y < 28 && (x < 35 || x > w - 40))) {
        const idx = (y * w + x) * 4;
        if (png.data[idx + 3] > 0) {
          png.data[idx + 3] = 0;
          cleared++;
        }
      }
    }
  }

  console.log(`Cleaned platform_act1_moss: cleared ${cleared} stray border pixels!`);
  fs.writeFileSync(file, PNG.sync.write(png));
  fs.writeFileSync('public/assets/tiles/platform_act1_moss.png', PNG.sync.write(png));
}

cleanSeamlessGround();
cleanPlatformMoss();
