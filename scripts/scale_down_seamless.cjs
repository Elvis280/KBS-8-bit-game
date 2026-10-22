const fs = require('fs');
const { PNG } = require('pngjs');

// 1. High-quality box/area downsampling
function resizePng(src, dstW, dstH) {
  const dst = new PNG({ width: dstW, height: dstH });
  const xRatio = src.width / dstW;
  const yRatio = src.height / dstH;

  for (let dy = 0; dy < dstH; dy++) {
    const syStart = dy * yRatio;
    const syEnd = (dy + 1) * yRatio;
    const sy0 = Math.floor(syStart);
    const sy1 = Math.min(src.height - 1, Math.floor(syEnd));

    for (let dx = 0; dx < dstW; dx++) {
      const sxStart = dx * xRatio;
      const sxEnd = (dx + 1) * xRatio;
      const sx0 = Math.floor(sxStart);
      const sx1 = Math.min(src.width - 1, Math.floor(sxEnd));

      let rSum = 0, gSum = 0, bSum = 0, aSum = 0, totalWeight = 0;

      for (let sy = sy0; sy <= sy1; sy++) {
        const yWeight = Math.min(sy + 1, syEnd) - Math.max(sy, syStart);
        if (yWeight <= 0) continue;

        for (let sx = sx0; sx <= sx1; sx++) {
          const xWeight = Math.min(sx + 1, sxEnd) - Math.max(sx, sxStart);
          if (xWeight <= 0) continue;

          const weight = xWeight * yWeight;
          const idx = (sy * src.width + sx) * 4;

          rSum += src.data[idx] * weight;
          gSum += src.data[idx + 1] * weight;
          bSum += src.data[idx + 2] * weight;
          aSum += src.data[idx + 3] * weight;
          totalWeight += weight;
        }
      }

      const dstIdx = (dy * dstW + dx) * 4;
      dst.data[dstIdx] = Math.round(rSum / totalWeight);
      dst.data[dstIdx + 1] = Math.round(gSum / totalWeight);
      dst.data[dstIdx + 2] = Math.round(bSum / totalWeight);
      dst.data[dstIdx + 3] = Math.round(aSum / totalWeight);
    }
  }

  return dst;
}

// 2. Seamless edge wrap & cosine blend
function makeSeamless(png, blendW = 28) {
  const w = png.width;
  const h = png.height;
  const out = new PNG({ width: w, height: h });

  // Half-shift wrap
  const halfW = Math.floor(w / 2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const srcX = (x + halfW) % w;
      const sIdx = (y * w + srcX) * 4;
      const dIdx = (y * w + x) * 4;
      out.data[dIdx] = png.data[sIdx];
      out.data[dIdx + 1] = png.data[sIdx + 1];
      out.data[dIdx + 2] = png.data[sIdx + 2];
      out.data[dIdx + 3] = png.data[sIdx + 3];
    }
  }

  // Smooth cosine cross-fade at center seam
  const seamX = w - halfW;
  const startX = seamX - Math.floor(blendW / 2);
  const endX = seamX + Math.floor(blendW / 2);

  for (let y = 0; y < h; y++) {
    for (let x = startX; x <= endX; x++) {
      if (x < 0 || x >= w) continue;
      const t = (x - startX) / (endX - startX);
      const easeT = (1 - Math.cos(t * Math.PI)) / 2;

      const xA = (x - Math.floor(blendW / 2) + w) % w;
      const xB = (x + Math.floor(blendW / 2)) % w;

      const idxA = (y * w + xA) * 4;
      const idxB = (y * w + xB) * 4;
      const idxOut = (y * w + x) * 4;

      out.data[idxOut] = Math.round(out.data[idxA] * (1 - easeT) + out.data[idxB] * easeT);
      out.data[idxOut + 1] = Math.round(out.data[idxA + 1] * (1 - easeT) + out.data[idxB + 1] * easeT);
      out.data[idxOut + 2] = Math.round(out.data[idxA + 2] * (1 - easeT) + out.data[idxB + 2] * easeT);
      out.data[idxOut + 3] = Math.round(out.data[idxA + 3] * (1 - easeT) + out.data[idxB + 3] * easeT);
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

// Load current seamless png (2170x432)
const srcSeamless = PNG.sync.read(fs.readFileSync('public/assets/tiles/Act_1/ground_act1_seamless.png'));
// Downsample to 724x144 (scale down by ~3x)
const resized = resizePng(srcSeamless, 724, 144);
const seamlessSmall = makeSeamless(resized, 24);
console.log('Scaled seamless (724x144) seam diff:', checkSeam(seamlessSmall));

// Save to both Act_1 and root tiles
fs.writeFileSync('public/assets/tiles/Act_1/ground_act1_seamless.png', PNG.sync.write(seamlessSmall));
fs.writeFileSync('public/assets/tiles/ground_act1_seamless.png', PNG.sync.write(seamlessSmall));
console.log('Saved scaled down ground_act1_seamless.png (724x144)!');

// Also downsample ground_act1_tile.png (1516x687) to ~505x229
const srcTile = PNG.sync.read(fs.readFileSync('public/assets/tiles/Act_1/ground_act1_tile.png'));
const resizedTile = resizePng(srcTile, 505, 229);
const seamlessTileSmall = makeSeamless(resizedTile, 24);
console.log('Scaled tile (505x229) seam diff:', checkSeam(seamlessTileSmall));
fs.writeFileSync('public/assets/tiles/Act_1/ground_act1_tile.png', PNG.sync.write(seamlessTileSmall));
fs.writeFileSync('public/assets/tiles/ground_act1_tile.png', PNG.sync.write(seamlessTileSmall));
console.log('Saved scaled down ground_act1_tile.png (505x229)!');
