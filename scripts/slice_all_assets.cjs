const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

function crop(srcPng, x, y, width, height) {
  x = Math.max(0, Math.min(srcPng.width - 1, Math.round(x)));
  y = Math.max(0, Math.min(srcPng.height - 1, Math.round(y)));
  width = Math.min(width, srcPng.width - x);
  height = Math.min(height, srcPng.height - y);

  const dst = new PNG({ width, height });
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const srcIdx = ((y + dy) * srcPng.width + (x + dx)) * 4;
      const dstIdx = (dy * width + dx) * 4;
      dst.data[dstIdx] = srcPng.data[srcIdx];
      dst.data[dstIdx + 1] = srcPng.data[srcIdx + 1];
      dst.data[dstIdx + 2] = srcPng.data[srcIdx + 2];
      dst.data[dstIdx + 3] = srcPng.data[srcIdx + 3];
    }
  }
  return dst;
}

function removeCheckerboard(png) {
  const w = png.width;
  const h = png.height;
  const visited = new Uint8Array(w * h);
  const queue = [];

  function isCheckerboard(r, g, b) {
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    return maxDiff <= 25 && r >= 130 && r <= 245 && g >= 130 && g <= 245 && b >= 130 && b <= 245;
  }

  // Queue borders
  for (let x = 0; x < w; x++) {
    queue.push(x, 0);
    queue.push(x, h - 1);
    visited[x] = 1;
    visited[(h - 1) * w + x] = 1;
  }
  for (let y = 0; y < h; y++) {
    queue.push(0, y);
    queue.push(w - 1, y);
    visited[y * w] = 1;
    visited[y * w + (w - 1)] = 1;
  }

  let head = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    const idx = (y * w + x) * 4;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];

    if (isCheckerboard(r, g, b)) {
      png.data[idx + 3] = 0;
      const neighbors = [
        [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
      ];
      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const npos = ny * w + nx;
          if (!visited[npos]) {
            visited[npos] = 1;
            queue.push(nx, ny);
          }
        }
      }
    }
  }
}

function removeDarkBackground(png) {
  const w = png.width;
  const h = png.height;
  const visited = new Uint8Array(w * h);
  const queue = [];

  function isDarkBg(r, g, b) {
    // dark slate background in props
    return r < 75 && g < 75 && b < 85;
  }

  for (let x = 0; x < w; x++) {
    queue.push(x, 0);
    queue.push(x, h - 1);
    visited[x] = 1;
    visited[(h - 1) * w + x] = 1;
  }
  for (let y = 0; y < h; y++) {
    queue.push(0, y);
    queue.push(w - 1, y);
    visited[y * w] = 1;
    visited[y * w + (w - 1)] = 1;
  }

  let head = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    const idx = (y * w + x) * 4;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];

    if (isDarkBg(r, g, b)) {
      png.data[idx + 3] = 0;
      const neighbors = [
        [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
      ];
      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const npos = ny * w + nx;
          if (!visited[npos]) {
            visited[npos] = 1;
            queue.push(nx, ny);
          }
        }
      }
    }
  }
}

function savePng(png, targetPath) {
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(targetPath, PNG.sync.write(png));
  console.log(`Saved: ${targetPath} (${png.width}x${png.height})`);
}

// -------------------------------------------------------------
// 1. Process Dialogue Portraits
// -------------------------------------------------------------
console.log('--- Processing Portraits ---');
const portraitsData = fs.readFileSync('raw_assets/Character Dialogue Portraits.png');
const portraitsPng = PNG.sync.read(portraitsData);

const portraitDefs = [
  // Hero (Row 1)
  { name: 'hero_neutral', x: 11, y: 65, w: 231, h: 235 },
  { name: 'hero_determined', x: 257, y: 65, w: 231, h: 235 },
  { name: 'hero_shocked', x: 499, y: 65, w: 228, h: 235 },

  // Mascot (Row 1)
  { name: 'mascot_happy', x: 769, y: 65, w: 165, h: 235 },
  { name: 'mascot_sad', x: 960, y: 65, w: 165, h: 235 },
  { name: 'mascot_crying', x: 1141, y: 65, w: 179, h: 235 },
  { name: 'mascot_mysterious', x: 1346, y: 65, w: 177, h: 235 },

  // King Aurel (Row 2)
  { name: 'aurel_weary', x: 11, y: 410, w: 372, h: 235 },
  { name: 'aurel_neutral', x: 394, y: 410, w: 368, h: 235 },
  { name: 'aurel_corrupted', x: 773, y: 410, w: 365, h: 235 },
  { name: 'aurel_shocked', x: 1152, y: 410, w: 370, h: 235 },

  // Royal Guard (Row 3)
  { name: 'guard_stern', x: 11, y: 740, w: 372, h: 235 },
  { name: 'guard_sympathetic', x: 397, y: 740, w: 365, h: 235 },
  { name: 'guard_alert', x: 776, y: 740, w: 362, h: 235 },
  { name: 'guard_grieving', x: 1155, y: 740, w: 370, h: 235 }
];

portraitDefs.forEach(p => {
  const cropped = crop(portraitsPng, p.x, p.y, p.w, p.h);
  savePng(cropped, `public/assets/portraits/${p.name}.png`);
});

// -------------------------------------------------------------
// 2. Process Panoramic Parallax Backgrounds
// -------------------------------------------------------------
console.log('--- Processing Backgrounds ---');
const bgDefs = [
  { file: 'raw_assets/Lumenfall outskirts.png', target: 'act1_bg.png', x: 135, y: 715, w: 1401, h: 309 },
  { file: 'raw_assets/Corrupted Lands.png', target: 'act2_bg.png', x: 160, y: 665, w: 1376, h: 359 },
  { file: 'raw_assets/Forgotten Sanctuary.png', target: 'act3_bg.png', x: 160, y: 620, w: 1376, h: 404 },
  { file: 'raw_assets/Castle Exterior.png', target: 'act4_bg.png', x: 0, y: 665, w: 820, h: 359 },
  { file: 'raw_assets/Castle Exterior.png', target: 'act4_throne_bg.png', x: 830, y: 665, w: 706, h: 359 },
  { file: 'raw_assets/Shattered Arena.png', target: 'act5_bg.png', x: 160, y: 620, w: 1376, h: 404 }
];

bgDefs.forEach(b => {
  const raw = PNG.sync.read(fs.readFileSync(b.file));
  const cropped = crop(raw, b.x, b.y, b.w, b.h);
  savePng(cropped, `public/assets/backgrounds/${b.target}`);
});

// -------------------------------------------------------------
// 3. Process Character Spritesheets (With Clean Label Cutoffs)
// -------------------------------------------------------------
console.log('--- Processing Character Spritesheets ---');
const charDefs = [
  { file: 'raw_assets/hero.png', target: 'hero_sheet.png', labelCutX: 160, cleanCheck: false },
  { file: 'raw_assets/mascot.png', target: 'mascot_sheet.png', labelCutX: 230, cleanCheck: true },
  { file: 'raw_assets/crowned-king-boss.png', target: 'king_aurel_sheet.png', labelCutX: 200, cleanCheck: true },
  { file: 'raw_assets/krish-epilogue.png', target: 'aurel_epilogue_sheet.png', labelCutX: 200, cleanCheck: true },
  { file: 'raw_assets/mascot-boss.png', target: 'mascot_boss_sheet.png', labelCutX: 200, cleanCheck: true },
  { file: 'raw_assets/royal-gaurd.png', target: 'royal_guard_sheet.png', labelCutX: 200, cleanCheck: true },
  { file: 'raw_assets/N-slime.png', target: 'normal_slimes_sheet.png', labelCutX: 235, cleanCheck: true },
  { file: 'raw_assets/C-Slime.png', target: 'corrupted_slime_sheet.png', labelCutX: 215, cleanCheck: true },
  { file: 'raw_assets/S-beast.png', target: 'sanctuary_beast_sheet.png', labelCutX: 215, cleanCheck: true }
];

charDefs.forEach(c => {
  const raw = PNG.sync.read(fs.readFileSync(c.file));
  if (c.cleanCheck) {
    removeCheckerboard(raw);
  }
  const cropped = crop(raw, c.labelCutX, 0, raw.width - c.labelCutX, raw.height);
  savePng(cropped, `public/assets/sprites/${c.target}`);
});

// -------------------------------------------------------------
// 4. Process Interactive Props & Relics
// -------------------------------------------------------------
console.log('--- Processing Props & Relics ---');
const props1Raw = PNG.sync.read(fs.readFileSync('raw_assets/Interactive Props-1.png'));
removeDarkBackground(props1Raw);
savePng(props1Raw, 'public/assets/props/props1_sheet.png');

// Debris (Fallen Beam Act I): top left
const debris = crop(props1Raw, 15, 60, 360, 110);
removeDarkBackground(debris);
savePng(debris, 'public/assets/props/debris_beam.png');

// 40-Coin Gate Machine
const coinMachine = crop(props1Raw, 10, 430, 1510, 220);
removeDarkBackground(coinMachine);
savePng(coinMachine, 'public/assets/props/coin_machine.png');

// Golden Castle Key
const goldenKey = crop(props1Raw, 10, 740, 290, 160);
removeDarkBackground(goldenKey);
savePng(goldenKey, 'public/assets/props/golden_key.png');

// Coins
const coins = crop(props1Raw, 670, 65, 320, 70);
removeDarkBackground(coins);
savePng(coins, 'public/assets/props/coins.png');

// Interactive Props 2 (Relics, Anchors, 12 Gifts)
const props2Raw = PNG.sync.read(fs.readFileSync('raw_assets/Interactive Props-2.png'));
removeDarkBackground(props2Raw);
savePng(props2Raw, 'public/assets/props/props2_sheet.png');

// Crown of Lumenfall
const crown = crop(props2Raw, 10, 70, 320, 380);
removeDarkBackground(crown);
savePng(crown, 'public/assets/props/crown_relic.png');

// Heart of Dawn
const heartOfDawn = crop(props2Raw, 345, 70, 320, 380);
removeDarkBackground(heartOfDawn);
savePng(heartOfDawn, 'public/assets/props/heart_of_dawn.png');

// The 3 Anchors
const anchors = crop(props2Raw, 670, 70, 330, 380);
removeDarkBackground(anchors);
savePng(anchors, 'public/assets/props/anchors.png');

// The 12 Collectible Gifts
const gifts = crop(props2Raw, 10, 530, 1000, 480);
removeDarkBackground(gifts);
savePng(gifts, 'public/assets/props/gifts_all.png');

console.log('=== All assets successfully sliced and processed with pure alpha! ===');
