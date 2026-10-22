const fs = require('fs');
const { PNG } = require('pngjs');

function mapDarkLocations(fileName) {
  const p = PNG.sync.read(fs.readFileSync('public/assets/tiles/Act_1/' + fileName));
  console.log(`\n=== Dark pixel locations in ${fileName} (${p.width}x${p.height}) ===`);
  
  let topDark = 0, bottomDark = 0, leftDark = 0, rightDark = 0;
  for (let y = 0; y < p.height; y++) {
    for (let x = 0; x < p.width; x++) {
      const idx = (y * p.width + x) * 4;
      const r = p.data[idx], g = p.data[idx + 1], b = p.data[idx + 2], a = p.data[idx + 3];
      if (a > 20 && r < 25 && g < 25 && b < 25) {
        if (y < 20) topDark++;
        if (y > p.height - 20) bottomDark++;
        if (x < 20) leftDark++;
        if (x > p.width - 20) rightDark++;
      }
    }
  }

  console.log(`Perimeter dark: Top(y<20)=${topDark}, Bottom(y>${p.height-20})=${bottomDark}, Left(x<20)=${leftDark}, Right(x>${p.width-20})=${rightDark}`);
}

['platform_act1_moss.png', 'platform_act1_log.png', 'platform_act1_stone.png', 'platform_act1_1.png', 'platform_act1_2.png'].forEach(mapDarkLocations);
