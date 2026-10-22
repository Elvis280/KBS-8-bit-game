const fs = require('fs');
const zlib = require('zlib');
const { PNG } = require('pngjs');

function loadRaw(filePath) {
  const buf = fs.readFileSync(filePath);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  let pos = 8;
  const idats = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.slice(pos + 4, pos + 8).toString('ascii');
    if (type === 'IDAT') idats.push(buf.slice(pos + 8, pos + 8 + len));
    pos += 12 + len;
    if (type === 'IEND') break;
  }
  const decompressed = zlib.inflateSync(Buffer.concat(idats));
  const bpp = 3;
  const stride = 1 + width * bpp;
  const raw = Buffer.alloc(width * height * bpp);

  for (let y = 0; y < height; y++) {
    const filterType = decompressed[y * stride];
    const rowOffset = y * stride + 1;
    const outRowOffset = y * width * bpp;
    const prevOutRowOffset = (y - 1) * width * bpp;

    for (let x = 0; x < width * bpp; x++) {
      const rawVal = decompressed[rowOffset + x];
      const a = x >= bpp ? raw[outRowOffset + x - bpp] : 0;
      const b = y > 0 ? raw[prevOutRowOffset + x] : 0;
      const c = (y > 0 && x >= bpp) ? raw[prevOutRowOffset + x - bpp] : 0;
      let val = 0;
      if (filterType === 0) val = rawVal;
      else if (filterType === 1) val = (rawVal + a) & 0xff;
      else if (filterType === 2) val = (rawVal + b) & 0xff;
      else if (filterType === 3) val = (rawVal + Math.floor((a + b) / 2)) & 0xff;
      else if (filterType === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        val = (rawVal + pr) & 0xff;
      }
      raw[outRowOffset + x] = val;
    }
  }
  return { width, height, raw };
}

const { width, height, raw } = loadRaw('public/assets/props/ladder.png');

// Ladder bounds in original: minX: 280, maxX: 742, minY: 26, maxY: 1494
const cropX1 = 280;
const cropX2 = 742;
const cropY1 = 26;
const cropY2 = 1494;
const cropW = cropX2 - cropX1;
const cropH = cropY2 - cropY1;

const ladderPng = new PNG({ width: cropW, height: cropH });

for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    const sidx = ((cropY1 + y) * width + (cropX1 + x)) * 3;
    const didx = (y * cropW + x) * 4;
    const r = raw[sidx], g = raw[sidx + 1], b = raw[sidx + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max - min;
    
    // Background is near white/light grey (max > 195 and sat < 22)
    const isBg = (max > 190 && sat < 24) || (r > 210 && g > 210 && b > 210);

    if (isBg) {
      ladderPng.data[didx] = 0;
      ladderPng.data[didx + 1] = 0;
      ladderPng.data[didx + 2] = 0;
      ladderPng.data[didx + 3] = 0;
    } else {
      ladderPng.data[didx] = r;
      ladderPng.data[didx + 1] = g;
      ladderPng.data[didx + 2] = b;
      ladderPng.data[didx + 3] = 255;
    }
  }
}

// Now create game-sized seamless ladder tile:
// In Phaser, climb_ladder is width 36.
// Let's create a 36-wide ladder texture that tiles smoothly!
const targetW = 36;
const scale = targetW / cropW;
const targetH = Math.round(cropH * scale);

const gameLadder = new PNG({ width: targetW, height: targetH });
for (let dy = 0; dy < targetH; dy++) {
  for (let dx = 0; dx < targetW; dx++) {
    const sx = Math.min(cropW - 1, Math.floor(dx / scale));
    const sy = Math.min(cropH - 1, Math.floor(dy / scale));
    const sidx = (sy * cropW + sx) * 4;
    const didx = (dy * targetW + dx) * 4;
    gameLadder.data[didx] = ladderPng.data[sidx];
    gameLadder.data[didx + 1] = ladderPng.data[sidx + 1];
    gameLadder.data[didx + 2] = ladderPng.data[sidx + 2];
    gameLadder.data[didx + 3] = ladderPng.data[sidx + 3];
  }
}

fs.writeFileSync('public/assets/props/ladder_clean.png', PNG.sync.write(ladderPng));
fs.writeFileSync('public/assets/props/climb_ladder.png', PNG.sync.write(gameLadder));
console.log('Saved clean transparent ladder: 36x' + targetH + ' to public/assets/props/climb_ladder.png');
