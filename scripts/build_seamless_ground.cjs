const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

// Let's create seamless versions for both ground_act1_tile and ground_act1_seamless
function makeSeamless(srcPng, cropX, cropY, cropW, cropH, blendW = 40) {
  const cropped = new PNG({ width: cropW, height: cropH });
  
  // 1. Copy cropped area
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcIdx = ((cropY + y) * srcPng.width + (cropX + x)) * 4;
      const dstIdx = (y * cropW + x) * 4;
      cropped.data[dstIdx] = srcPng.data[srcIdx];
      cropped.data[dstIdx + 1] = srcPng.data[srcIdx + 1];
      cropped.data[dstIdx + 2] = srcPng.data[srcIdx + 2];
      cropped.data[dstIdx + 3] = srcPng.data[srcIdx + 3];
    }
  }

  // 2. Blend left edge (x: 0..blendW) with right edge (x: cropW - blendW .. cropW - 1)
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < blendW; x++) {
      const t = x / blendW; // 0 at left edge -> 1 at blendW
      const leftIdx = (y * cropW + x) * 4;
      const rightIdx = (y * cropW + (cropW - blendW + x)) * 4;

      const aL = cropped.data[leftIdx + 3];
      const aR = cropped.data[rightIdx + 3];
      const a = Math.round(aL * t + aR * (1 - t));

      const r = Math.round(cropped.data[leftIdx] * t + cropped.data[rightIdx] * (1 - t));
      const g = Math.round(cropped.data[leftIdx + 1] * t + cropped.data[rightIdx + 1] * (1 - t));
      const b = Math.round(cropped.data[leftIdx + 2] * t + cropped.data[rightIdx + 2] * (1 - t));

      cropped.data[leftIdx] = r;
      cropped.data[leftIdx + 1] = g;
      cropped.data[leftIdx + 2] = b;
      cropped.data[leftIdx + 3] = a;
    }
  }

  return cropped;
}

// Check seam diff
function checkSeam(png) {
  let diff = 0;
  for (let y = 0; y < png.height; y++) {
    const i1 = (y * png.width) * 4;
    const i2 = (y * png.width + (png.width - 1)) * 4;
    diff += Math.abs(png.data[i1] - png.data[i2]) +
            Math.abs(png.data[i1 + 1] - png.data[i2 + 1]) +
            Math.abs(png.data[i1 + 2] - png.data[i2 + 2]);
  }
  return (diff / png.height).toFixed(2);
}

// Process ground_act1_tile.png:
// Content is X: [10..1526], Y: [210..902]
// Top grass tips start at Y=215, dense grass at Y=248.
// Let's crop from Y=215 to 902 (height 687), X=10 to 1526 (width 1516)
const tilePng = PNG.sync.read(fs.readFileSync('public/assets/tiles/Act_1/ground_act1_tile.png'));
const seamlessTile = makeSeamless(tilePng, 10, 215, 1516, 687, 48);
console.log('ground_act1_tile seamless diff:', checkSeam(seamlessTile));
fs.writeFileSync('public/assets/tiles/Act_1/ground_act1_tile.png', PNG.sync.write(seamlessTile));
console.log('Saved seamless ground_act1_tile.png (1516x687)');

// Process ground_act1_seamless.png:
// Content is X: [0..2171], Y: [159..597]
// Top grass starts at Y=165, dense grass at Y=197.
// Crop Y=165 to 597 (height 432), X=0 to 2171 (width 2171)
const seamlessPng = PNG.sync.read(fs.readFileSync('public/assets/tiles/Act_1/ground_act1_seamless.png'));
const seamlessFull = makeSeamless(seamlessPng, 0, 165, 2170, 432, 48);
console.log('ground_act1_seamless diff:', checkSeam(seamlessFull));
fs.writeFileSync('public/assets/tiles/Act_1/ground_act1_seamless.png', PNG.sync.write(seamlessFull));
console.log('Saved seamless ground_act1_seamless.png (2170x432)');
