const fs = require('fs');
const { PNG } = require('pngjs');

// High-quality downsampling function
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

// Test downsampling ground_act1_seamless.png
const src = PNG.sync.read(fs.readFileSync('public/assets/tiles/Act_1/ground_act1_seamless.png'));
console.log('Original seamless:', src.width, 'x', src.height);

// Scale to 1/3 (723 x 144)
const scaled1_3 = resizePng(src, 723, 144);
console.log('Scaled 1/3 (723x144) seam diff:', checkSeam(scaled1_3));

// Scale to 1/2.5 (~868 x 173)
const scaled2_5 = resizePng(src, 868, 173);
console.log('Scaled 2.5 (868x173) seam diff:', checkSeam(scaled2_5));
