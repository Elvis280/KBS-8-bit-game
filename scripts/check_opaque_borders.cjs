const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

function inspectFolder(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      inspectFolder(full);
      return;
    }
    if (!file.endsWith('.png')) return;

    const b = fs.readFileSync(full);
    const p = PNG.sync.read(b);

    // Sample corner pixels and edge pixels
    const corners = [
      [0, 0],
      [p.width - 1, 0],
      [0, p.height - 1],
      [p.width - 1, p.height - 1]
    ];
    let nonZeroCorner = 0;
    for (const [x, y] of corners) {
      const a = p.data[(y * p.width + x) * 4 + 3];
      if (a > 0) nonZeroCorner++;
    }

    // Check border pixels (x=0, x=w-1, y=0, y=h-1)
    let borderOpaque = 0;
    let borderCount = 0;
    let darkCount = 0;
    for (let x = 0; x < p.width; x++) {
      for (const y of [0, p.height - 1]) {
        borderCount++;
        const idx = (y * p.width + x) * 4;
        const a = p.data[idx + 3];
        const r = p.data[idx], g = p.data[idx + 1], b = p.data[idx + 2];
        if (a > 20) {
          borderOpaque++;
          if (r < 30 && g < 30 && b < 30) darkCount++;
        }
      }
    }
    for (let y = 0; y < p.height; y++) {
      for (const x of [0, p.width - 1]) {
        borderCount++;
        const idx = (y * p.width + x) * 4;
        const a = p.data[idx + 3];
        const r = p.data[idx], g = p.data[idx + 1], b = p.data[idx + 2];
        if (a > 20) {
          borderOpaque++;
          if (r < 30 && g < 30 && b < 30) darkCount++;
        }
      }
    }

    if (borderOpaque > borderCount * 0.1 || nonZeroCorner > 0) {
      console.log(`⚠️ ${file} (${p.width}x${p.height}): borderOpaque=${borderOpaque}/${borderCount} (${(borderOpaque/borderCount*100).toFixed(1)}%), cornersNonZero=${nonZeroCorner}, darkPixels=${darkCount}`);
    } else {
      console.log(`✅ ${file} (${p.width}x${p.height}): Clean transparent borders`);
    }
  });
}

console.log('--- Inspecting tiles ---');
inspectFolder('public/assets/tiles');

console.log('\n--- Inspecting props ---');
inspectFolder('public/assets/props');
