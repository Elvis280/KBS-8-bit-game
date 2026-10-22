const fs = require('fs');
const { PNG } = require('pngjs');

['ground_act1_seamless.png', 'ground_act1_tile.png'].forEach(file => {
  const p = PNG.sync.read(fs.readFileSync('public/assets/tiles/Act_1/' + file));
  console.log(`\n=== ${file} (${p.width}x${p.height}) ===`);
  
  // Find top solid grass row and bottom content row
  let topRow = -1, solidRow = -1, bottomRow = -1;
  for (let y = 0; y < p.height; y++) {
    let solid = 0;
    for (let x = 0; x < p.width; x++) {
      if (p.data[(y * p.width + x) * 4 + 3] > 20) {
        if (topRow === -1) topRow = y;
        bottomRow = y;
      }
      if (p.data[(y * p.width + x) * 4 + 3] > 180) solid++;
    }
    if (solidRow === -1 && solid > p.width * 0.4) {
      solidRow = y;
    }
  }

  console.log(`Top grass fringe: y=${topRow}`);
  console.log(`Solid turf line:  y=${solidRow}`);
  console.log(`Bottom content:   y=${bottomRow}`);
  console.log(`Total content height: ${bottomRow - topRow + 1}px`);
});
