const fs = require('fs');
const { PNG } = require('pngjs');

function createSeamlessTexture(srcPng, cropX, cropY, cropW, cropH, blendWidth = 64) {
  // 1. First crop the region
  const cropped = new PNG({ width: cropW, height: cropH });
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const sIdx = ((cropY + y) * srcPng.width + (cropX + x)) * 4;
      const dIdx = (y * cropW + x) * 4;
      cropped.data[dIdx] = srcPng.data[sIdx];
      cropped.data[dIdx + 1] = srcPng.data[sIdx + 1];
      cropped.data[dIdx + 2] = srcPng.data[sIdx + 2];
      cropped.data[dIdx + 3] = srcPng.data[sIdx + 3];
    }
  }

  // 2. Wrap image: swap left half and right half
  // Now original left and right edges meet in the exact center!
  // And the new left (0) and new right (cropW - 1) were adjacent neighbors in the original!
  const halfW = Math.floor(cropW / 2);
  const out = new PNG({ width: cropW, height: cropH });

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcX = (x + halfW) % cropW;
      const sIdx = (y * cropW + srcX) * 4;
      const dIdx = (y * cropW + x) * 4;
      out.data[dIdx] = cropped.data[sIdx];
      out.data[dIdx + 1] = cropped.data[sIdx + 1];
      out.data[dIdx + 2] = cropped.data[sIdx + 2];
      out.data[dIdx + 3] = cropped.data[sIdx + 3];
    }
  }

  // 3. Smoothly blend the center seam (around halfW) where the original edges now meet
  // The seam is now at x = (cropW - halfW)
  const seamX = cropW - halfW;
  const startX = seamX - Math.floor(blendWidth / 2);
  const endX = seamX + Math.floor(blendWidth / 2);

  for (let y = 0; y < cropH; y++) {
    for (let x = startX; x <= endX; x++) {
      if (x < 0 || x >= cropW) continue;
      const t = (x - startX) / (endX - startX); // 0 to 1
      // Smooth cosine easing
      const easeT = (1 - Math.cos(t * Math.PI)) / 2;

      // Sample from the two sides
      // Left side of seam came from right of original: cropX + x + halfW
      // Right side of seam came from left of original: cropX + x - (cropW - halfW)
      const xA = (x - Math.floor(blendWidth / 2) + cropW) % cropW;
      const xB = (x + Math.floor(blendWidth / 2)) % cropW;

      const idxA = (y * cropW + xA) * 4;
      const idxB = (y * cropW + xB) * 4;
      const idxOut = (y * cropW + x) * 4;

      const a = Math.round(out.data[idxA + 3] * (1 - easeT) + out.data[idxB + 3] * easeT);
      const r = Math.round(out.data[idxA] * (1 - easeT) + out.data[idxB] * easeT);
      const g = Math.round(out.data[idxA + 1] * (1 - easeT) + out.data[idxB + 1] * easeT);
      const b = Math.round(out.data[idxA + 2] * (1 - easeT) + out.data[idxB + 2] * easeT);

      out.data[idxOut] = r;
      out.data[idxOut + 1] = g;
      out.data[idxOut + 2] = b;
      out.data[idxOut + 3] = a;
    }
  }

  return out;
}

function checkSeam(png) {
  let diff = 0;
  for (let y = 0; y < png.height; y++) {
    const i1 = (y * png.width) * 4;
    const i2 = (y * png.width + (png.width - 1)) * 4;
    diff += Math.abs(png.data[i1] - png.data[i2]) +
            Math.abs(png.data[i1 + 1] - png.data[i2 + 1]) +
            Math.abs(png.data[i1 + 2] - png.data[i2 + 2]) +
            Math.abs(png.data[i1 + 3] - png.data[i2 + 3]);
  }
  return (diff / png.height).toFixed(2);
}

// Read raw backed-up tiles with clean alpha
const rawTile = PNG.sync.read(fs.readFileSync('public/assets/tiles/Act_1/ground_act1_tile.raw_bak.png'));
// Clean checkerboard on raw
require('./clean_act1_alphas.cjs'); // ensures clean alpha
const cleanedTile = PNG.sync.read(fs.readFileSync('public/assets/tiles/Act_1/ground_act1_tile.png'));

const seamlessTile = createSeamlessTexture(cleanedTile, 10, 215, 1516, 687, 80);
console.log('New ground_act1_tile seam diff:', checkSeam(seamlessTile));
fs.writeFileSync('public/assets/tiles/Act_1/ground_act1_tile.png', PNG.sync.write(seamlessTile));

const cleanedSeamless = PNG.sync.read(fs.readFileSync('public/assets/tiles/Act_1/ground_act1_seamless.raw_bak.png'));
// Let's create the seamless version
const seamlessFull = createSeamlessTexture(cleanedSeamless, 0, 165, 2170, 432, 80);
console.log('New ground_act1_seamless seam diff:', checkSeam(seamlessFull));
fs.writeFileSync('public/assets/tiles/Act_1/ground_act1_seamless.png', PNG.sync.write(seamlessFull));
