const fs = require('fs');
const { PNG } = require('pngjs');

// Standard frame size
const FRAME_W = 384;
const FRAME_H = 512;
const BASELINE_Y = 496; // Feet touch this exact Y line across all frames!

const frameCount = 8;
const sheetWidth = FRAME_W * frameCount;
const sheetHeight = FRAME_H;

// Create horizontal spritesheet (RGBA)
const runSheet = new PNG({ width: sheetWidth, height: sheetHeight });

// Initialize to fully transparent
runSheet.data.fill(0);

for (let i = 1; i <= frameCount; i++) {
  const srcPath = `public/assets/sprites/hero/hero_moving_left_${i}.png`;
  const data = fs.readFileSync(srcPath);
  const png = PNG.sync.read(data);

  // Find exact content bounds
  let topY = png.height, botY = 0, leftX = png.width, rightX = 0;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (y * png.width + x) * 4;
      if (png.data[idx + 3] > 20) {
        if (y < topY) topY = y;
        if (y > botY) botY = y;
        if (x < leftX) leftX = x;
        if (x > rightX) rightX = x;
      }
    }
  }

  const charW = rightX - leftX + 1;
  const charH = botY - topY + 1;

  // Calculate target placement in frame (i - 1)
  const frameOffsetX = (i - 1) * FRAME_W;
  const targetFeetY = BASELINE_Y;
  const targetTopY = targetFeetY - charH + 1;
  const targetLeftX = Math.round((FRAME_W - charW) / 2);

  // Copy pixels while flipping horizontally so the hero faces Right by default!
  for (let cy = 0; cy < charH; cy++) {
    for (let cx = 0; cx < charW; cx++) {
      // Source pixel (facing left)
      const srcX = leftX + cx;
      const srcY = topY + cy;
      const srcIdx = (srcY * png.width + srcX) * 4;
      const alpha = png.data[srcIdx + 3];

      if (alpha > 0) {
        // Flipped destination pixel (facing right)
        const flippedCx = (charW - 1) - cx;
        const dstX = frameOffsetX + targetLeftX + flippedCx;
        const dstY = targetTopY + cy;

        if (dstX >= 0 && dstX < sheetWidth && dstY >= 0 && dstY < sheetHeight) {
          const dstIdx = (dstY * sheetWidth + dstX) * 4;
          runSheet.data[dstIdx] = png.data[srcIdx];
          runSheet.data[dstIdx + 1] = png.data[srcIdx + 1];
          runSheet.data[dstIdx + 2] = png.data[srcIdx + 2];
          runSheet.data[dstIdx + 3] = alpha;
        }
      }
    }
  }

  console.log(`Placed frame ${i} (char: ${charW}x${charH}) at target Y=${targetTopY}..${targetFeetY}`);
}

const outSheetPath = 'public/assets/sprites/hero/hero_run_sheet.png';
fs.writeFileSync(outSheetPath, PNG.sync.write(runSheet));
console.log(`Saved standardized run sheet to ${outSheetPath} (${sheetWidth}x${sheetHeight})`);

// Also save an idle sprite (frame 0 from the sheet)
const idlePng = new PNG({ width: FRAME_W, height: FRAME_H });
for (let y = 0; y < FRAME_H; y++) {
  for (let x = 0; x < FRAME_W; x++) {
    const srcIdx = (y * sheetWidth + x) * 4;
    const dstIdx = (y * FRAME_W + x) * 4;
    idlePng.data[dstIdx] = runSheet.data[srcIdx];
    idlePng.data[dstIdx + 1] = runSheet.data[srcIdx + 1];
    idlePng.data[dstIdx + 2] = runSheet.data[srcIdx + 2];
    idlePng.data[dstIdx + 3] = runSheet.data[srcIdx + 3];
  }
}
const outIdlePath = 'public/assets/sprites/hero/hero_idle.png';
fs.writeFileSync(outIdlePath, PNG.sync.write(idlePng));
console.log(`Saved hero_idle.png to ${outIdlePath}`);
