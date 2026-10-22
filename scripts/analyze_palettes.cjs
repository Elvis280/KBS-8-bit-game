const fs = require('fs');
const { PNG } = require('pngjs');

function analyzePalette(name) {
  const p = PNG.sync.read(fs.readFileSync('public/assets/tiles/Act_1/' + name));
  console.log(`\n--- Palette for ${name} ---`);
  // Top layer (grass)
  let grassR = 0, grassG = 0, grassB = 0, gCount = 0;
  for (let y = 10; y < Math.min(60, p.height); y++) {
    for (let x = 0; x < p.width; x += 10) {
      const idx = (y * p.width + x) * 4;
      if (p.data[idx + 3] > 100) {
        grassR += p.data[idx];
        grassG += p.data[idx + 1];
        grassB += p.data[idx + 2];
        gCount++;
      }
    }
  }
  if (gCount > 0) {
    console.log(`Grass avg color: RGB(${Math.round(grassR/gCount)}, ${Math.round(grassG/gCount)}, ${Math.round(grassB/gCount)})`);
  }

  // Mid layer (soil)
  let soilR = 0, soilG = 0, soilB = 0, sCount = 0;
  const midY = Math.floor(p.height / 2);
  for (let y = midY - 20; y < midY + 20; y++) {
    for (let x = 0; x < p.width; x += 10) {
      const idx = (y * p.width + x) * 4;
      if (p.data[idx + 3] > 100) {
        soilR += p.data[idx];
        soilG += p.data[idx + 1];
        soilB += p.data[idx + 2];
        sCount++;
      }
    }
  }
  if (sCount > 0) {
    console.log(`Soil avg color:  RGB(${Math.round(soilR/sCount)}, ${Math.round(soilG/sCount)}, ${Math.round(soilB/sCount)})`);
  }
}

analyzePalette('ground_act1_seamless.png');
analyzePalette('ground_act1_tile.png');
