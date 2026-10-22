const fs = require('fs');
const { PNG } = require('pngjs');

const platforms = [
  'platform_act1_1.png',
  'platform_act1_2.png',
  'platform_act1_log.png',
  'platform_act1_moss.png',
  'platform_act1_stone.png'
];

platforms.forEach(file => {
  const p = PNG.sync.read(fs.readFileSync('public/assets/tiles/Act_1/' + file));
  console.log(`\n=== Analyzing ${file} (${p.width}x${p.height}) ===`);

  // Count non-transparent pixels in top 15 rows
  let top15Count = 0;
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < p.width; x++) {
      if (p.data[(y * p.width + x) * 4 + 3] > 20) top15Count++;
    }
  }

  // Count in bottom 15 rows
  let bottom15Count = 0;
  for (let y = p.height - 15; y < p.height; y++) {
    for (let x = 0; x < p.width; x++) {
      if (p.data[(y * p.width + x) * 4 + 3] > 20) bottom15Count++;
    }
  }

  // Count in left 15 cols
  let left15Count = 0;
  for (let y = 0; y < p.height; y++) {
    for (let x = 0; x < 15; x++) {
      if (p.data[(y * p.width + x) * 4 + 3] > 20) left15Count++;
    }
  }

  // Count in right 15 cols
  let right15Count = 0;
  for (let y = 0; y < p.height; y++) {
    for (let x = p.width - 15; x < p.width; x++) {
      if (p.data[(y * p.width + x) * 4 + 3] > 20) right15Count++;
    }
  }

  console.log(`Border occupancy: Top=${top15Count}, Bottom=${bottom15Count}, Left=${left15Count}, Right=${right15Count}`);
});
