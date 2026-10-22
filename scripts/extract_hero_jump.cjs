const fs = require('fs');
const zlib = require('zlib');
const { PNG } = require('pngjs');

const buf = fs.readFileSync('public/assets/sprites/hero/hero_jump_right.png');
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

// Extract pose 1: columns 20 to 450
const cropX1 = 20;
const cropX2 = 450;
const cropW = cropX2 - cropX1;
const cropH = height;

const jumpPng = new PNG({ width: cropW, height: cropH });
for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    const sidx = (y * width + (cropX1 + x)) * 3;
    const didx = (y * cropW + x) * 4;
    jumpPng.data[didx] = raw[sidx];
    jumpPng.data[didx + 1] = raw[sidx + 1];
    jumpPng.data[didx + 2] = raw[sidx + 2];
    jumpPng.data[didx + 3] = 255;
  }
}

// Flood fill background from outside border of crop
const visited = new Uint8Array(cropW * cropH);
const queue = [];
for (let x = 0; x < cropW; x++) {
  queue.push(x);
  queue.push((cropH - 1) * cropW + x);
  visited[x] = 1;
  visited[(cropH - 1) * cropW + x] = 1;
}
for (let y = 0; y < cropH; y++) {
  queue.push(y * cropW);
  queue.push(y * cropW + (cropW - 1));
  visited[y * cropW] = 1;
  visited[y * cropW + (cropW - 1)] = 1;
}

while (queue.length > 0) {
  const curr = queue.pop();
  const cx = curr % cropW;
  const cy = Math.floor(curr / cropW);
  const neighbors = [[cx-1, cy], [cx+1, cy], [cx, cy-1], [cx, cy+1]];
  for (const [nx, ny] of neighbors) {
    if (nx >= 0 && nx < cropW && ny >= 0 && ny < cropH) {
      const nidx = ny * cropW + nx;
      if (!visited[nidx]) {
        const pidx = nidx * 4;
        const r = jumpPng.data[pidx], g = jumpPng.data[pidx+1], b = jumpPng.data[pidx+2];
        const isLight = r > 180 && g > 180 && b > 180;
        const isNeutral = Math.abs(r - g) < 25 && Math.abs(g - b) < 25;
        if (isLight && isNeutral) {
          visited[nidx] = 1;
          queue.push(nidx);
        }
      }
    }
  }
}

for (let i = 0; i < cropW * cropH; i++) {
  if (visited[i]) {
    jumpPng.data[i * 4 + 3] = 0;
  }
}

// Find character bounds in jump
let minX = cropW, maxX = 0, minY = cropH, maxY = 0;
for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    if (jumpPng.data[(y * cropW + x) * 4 + 3] > 20) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log('Jump pose character bounds:', { minX, maxX, minY, maxY, cw: maxX - minX + 1, ch: maxY - minY + 1 });

// Place on standardized 384 x 512 canvas
const outJump = new PNG({ width: 384, height: 512 });
outJump.data.fill(0);

const charW = maxX - minX + 1;
const charH = maxY - minY + 1;
const scale = Math.min(360 / charW, 490 / charH);
const targetW = Math.round(charW * scale);
const targetH = Math.round(charH * scale);
const targetLeftX = Math.round((384 - targetW) / 2);
const targetTopY = Math.round(496 - targetH);

for (let dy = 0; dy < targetH; dy++) {
  for (let dx = 0; dx < targetW; dx++) {
    const sx = minX + Math.floor(dx / scale);
    const sy = minY + Math.floor(dy / scale);
    const sidx = (sy * cropW + sx) * 4;
    const didx = ((targetTopY + dy) * 384 + (targetLeftX + dx)) * 4;
    if (jumpPng.data[sidx + 3] > 0) {
      outJump.data[didx] = jumpPng.data[sidx];
      outJump.data[didx + 1] = jumpPng.data[sidx + 1];
      outJump.data[didx + 2] = jumpPng.data[sidx + 2];
      outJump.data[didx + 3] = jumpPng.data[sidx + 3];
    }
  }
}

const outJumpPath = 'public/assets/sprites/hero/hero_jump.png';
fs.writeFileSync(outJumpPath, PNG.sync.write(outJump));
console.log('Saved transparent standardized jump sprite to ' + outJumpPath);
