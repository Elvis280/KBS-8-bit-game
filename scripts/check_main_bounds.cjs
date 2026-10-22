const fs = require('fs');
const { PNG } = require('pngjs');

const pMain = PNG.sync.read(fs.readFileSync('public/assets/tiles/Act_1/ground_act1_main.png'));
let mMinX = pMain.width, mMaxX = 0, mMinY = pMain.height, mMaxY = 0;
for (let y = 0; y < pMain.height; y++) {
  for (let x = 0; x < pMain.width; x++) {
    const idx = (y * pMain.width + x) * 4;
    const a = pMain.data[idx + 3];
    if (a > 15) {
      if (x < mMinX) mMinX = x;
      if (x > mMaxX) mMaxX = x;
      if (y < mMinY) mMinY = y;
      if (y > mMaxY) mMaxY = y;
    }
  }
}
console.log('ground_act1_main.png bounds:');
console.log(`X: [${mMinX}..${mMaxX}] (${mMaxX - mMinX + 1}px wide)`);
console.log(`Y: [${mMinY}..${mMaxY}] (${mMaxY - mMinY + 1}px high, image total H=${pMain.height})`);

// Sample colors in the middle
console.log('Color at (mid, mMinY + 10):',
  pMain.data[( (mMinY+10) * pMain.width + Math.floor(pMain.width/2)) * 4],
  pMain.data[( (mMinY+10) * pMain.width + Math.floor(pMain.width/2)) * 4 + 1],
  pMain.data[( (mMinY+10) * pMain.width + Math.floor(pMain.width/2)) * 4 + 2],
  pMain.data[( (mMinY+10) * pMain.width + Math.floor(pMain.width/2)) * 4 + 3]
);
