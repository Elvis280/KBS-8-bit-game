const fs = require('fs');
const { PNG } = require('pngjs');

['ground_act1_seamless.png', 'ground_act1_tile.png'].forEach(file => {
  const png = PNG.sync.read(fs.readFileSync('public/assets/tiles/Act_1/' + file));
  let totalDiff = 0;
  let count = 0;
  for (let y = 0; y < png.height; y++) {
    const leftIdx = y * png.width * 4;
    const rightIdx = (y * png.width + (png.width - 1)) * 4;
    const d = Math.abs(png.data[leftIdx] - png.data[rightIdx]) +
              Math.abs(png.data[leftIdx + 1] - png.data[rightIdx + 1]) +
              Math.abs(png.data[leftIdx + 2] - png.data[rightIdx + 2]);
    totalDiff += d;
    count++;
  }
  console.log(file, 'Average RGB diff between x=0 and x=w-1:', (totalDiff / count).toFixed(2));
});
