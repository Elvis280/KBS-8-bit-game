const fs = require('fs');
const { PNG } = require('pngjs');

// 1. ground_act1_seamless.png: find bounds of non-black pixels
const pSeamless = PNG.sync.read(fs.readFileSync('public/assets/tiles/Act_1/ground_act1_seamless.png'));
let sMinX = pSeamless.width, sMaxX = 0, sMinY = pSeamless.height, sMaxY = 0;
for (let y = 0; y < pSeamless.height; y++) {
  for (let x = 0; x < pSeamless.width; x++) {
    const idx = (y * pSeamless.width + x) * 4;
    const r = pSeamless.data[idx];
    const g = pSeamless.data[idx + 1];
    const b = pSeamless.data[idx + 2];
    if (r > 15 || g > 15 || b > 15) {
      if (x < sMinX) sMinX = x;
      if (x > sMaxX) sMaxX = x;
      if (y < sMinY) sMinY = y;
      if (y > sMaxY) sMaxY = y;
    }
  }
}
console.log('ground_act1_seamless.png non-black bounds:');
console.log(`X: [${sMinX}..${sMaxX}] (${sMaxX - sMinX + 1}px wide)`);
console.log(`Y: [${sMinY}..${sMaxY}] (${sMaxY - sMinY + 1}px high, image total H=${pSeamless.height})`);

// 2. ground_act1_tile.png: find bounds of non-checkerboard pixels
const pTile = PNG.sync.read(fs.readFileSync('public/assets/tiles/Act_1/ground_act1_tile.png'));
let tMinX = pTile.width, tMaxX = 0, tMinY = pTile.height, tMaxY = 0;
for (let y = 0; y < pTile.height; y++) {
  for (let x = 0; x < pTile.width; x++) {
    const idx = (y * pTile.width + x) * 4;
    const r = pTile.data[idx];
    const g = pTile.data[idx + 1];
    const b = pTile.data[idx + 2];
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    const isChecker = (maxDiff <= 10 && r >= 200);
    if (!isChecker) {
      if (x < tMinX) tMinX = x;
      if (x > tMaxX) tMaxX = x;
      if (y < tMinY) tMinY = y;
      if (y > tMaxY) tMaxY = y;
    }
  }
}
console.log('\nground_act1_tile.png non-checker bounds:');
console.log(`X: [${tMinX}..${tMaxX}] (${tMaxX - tMinX + 1}px wide)`);
console.log(`Y: [${tMinY}..${tMaxY}] (${tMaxY - tMinY + 1}px high, image total H=${pTile.height})`);
