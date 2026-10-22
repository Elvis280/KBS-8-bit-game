const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

console.log('=== Building Game-Ready Tiles & Platforms for Acts 2 to 5 ===');

function isNearBlack(r, g, b, threshold = 28) {
  return r < threshold && g < threshold && b < threshold;
}

// ---------------------------------------------------------------------------
// 1. Process Floating Platforms (Clear outer black canvas to transparent alpha)
// ---------------------------------------------------------------------------
function buildPlatform(srcPath, outPath, cropBox = null) {
  const data = fs.readFileSync(srcPath);
  const src = PNG.sync.read(data);
  const w = src.width, h = src.height;

  // Flood fill from all 4 borders to remove outer black background
  const visited = new Uint8Array(w * h);
  const queue = [];

  for (let x = 0; x < w; x++) {
    if (isNearBlack(src.data[x * 4], src.data[x * 4 + 1], src.data[x * 4 + 2])) {
      visited[x] = 1; queue.push(x, 0);
    }
    const bPos = (h - 1) * w + x;
    if (isNearBlack(src.data[bPos * 4], src.data[bPos * 4 + 1], src.data[bPos * 4 + 2])) {
      visited[bPos] = 1; queue.push(x, h - 1);
    }
  }

  for (let y = 0; y < h; y++) {
    const lPos = y * w;
    if (isNearBlack(src.data[lPos * 4], src.data[lPos * 4 + 1], src.data[lPos * 4 + 2]) && !visited[lPos]) {
      visited[lPos] = 1; queue.push(0, y);
    }
    const rPos = y * w + w - 1;
    if (isNearBlack(src.data[rPos * 4], src.data[rPos * 4 + 1], src.data[rPos * 4 + 2]) && !visited[rPos]) {
      visited[rPos] = 1; queue.push(w - 1, y);
    }
  }

  let head = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    const neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nPos = ny * w + nx;
        if (!visited[nPos] && isNearBlack(src.data[nPos * 4], src.data[nPos * 4 + 1], src.data[nPos * 4 + 2])) {
          visited[nPos] = 1;
          queue.push(nx, ny);
        }
      }
    }
  }

  let minX = w, maxX = 0, minY = h, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pos = y * w + x;
      const idx = pos * 4;
      if (visited[pos]) {
        src.data[idx + 3] = 0;
      } else {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (cropBox) {
    minX = Math.max(0, cropBox.minX);
    maxX = Math.min(w - 1, cropBox.maxX);
    minY = Math.max(0, cropBox.minY);
    maxY = Math.min(h - 1, cropBox.maxY);
  } else {
    minX = Math.max(0, minX - 4);
    maxX = Math.min(w - 1, maxX + 4);
    minY = Math.max(0, minY - 4);
    maxY = Math.min(h - 1, maxY + 4);
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const dst = new PNG({ width: cropW, height: cropH });

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcIdx = ((minY + y) * w + (minX + x)) * 4;
      const dstIdx = (y * cropW + x) * 4;
      dst.data[dstIdx] = src.data[srcIdx];
      dst.data[dstIdx + 1] = src.data[srcIdx + 1];
      dst.data[dstIdx + 2] = src.data[srcIdx + 2];
      dst.data[dstIdx + 3] = src.data[srcIdx + 3];
    }
  }

  fs.writeFileSync(outPath, PNG.sync.write(dst));
  console.log(`[Platform] -> ${outPath} (${cropW}x${cropH})`);
}

// ---------------------------------------------------------------------------
// 2. Process Seamless Ground (Transparent sky above, horizontal seamless wrap)
// ---------------------------------------------------------------------------
function buildSeamlessGround(srcPath, outPath) {
  const data = fs.readFileSync(srcPath);
  const src = PNG.sync.read(data);
  const w = src.width, h = src.height;

  // Flood fill from TOP border only to clear the sky to transparent
  const visitedTop = new Uint8Array(w * h);
  const qTop = [];
  for (let x = 0; x < w; x++) {
    if (isNearBlack(src.data[x * 4], src.data[x * 4 + 1], src.data[x * 4 + 2])) {
      visitedTop[x] = 1; qTop.push(x, 0);
    }
  }

  let head = 0;
  while (head < qTop.length) {
    const x = qTop[head++];
    const y = qTop[head++];
    const neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const pos = ny * w + nx;
        if (!visitedTop[pos] && isNearBlack(src.data[pos * 4], src.data[pos * 4 + 1], src.data[pos * 4 + 2])) {
          visitedTop[pos] = 1;
          qTop.push(nx, ny);
        }
      }
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pos = y * w + x;
      if (visitedTop[pos]) {
        src.data[pos * 4 + 3] = 0;
      }
    }
  }

  // Find first row containing ground pixels
  let firstY = h;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (src.data[(y * w + x) * 4 + 3] > 0) {
        if (y < firstY) firstY = y;
      }
    }
  }

  // Find bottom border where ground ends
  let lastY = firstY + 100;
  for (let y = h - 1; y >= firstY; y--) {
    let blackRow = 0;
    for (let x = 0; x < w; x++) {
      if (isNearBlack(src.data[(y * w + x) * 4], src.data[(y * w + x) * 4 + 1], src.data[(y * w + x) * 4 + 2])) {
        blackRow++;
      }
    }
    if (blackRow < w * 0.5) {
      lastY = y;
      break;
    }
  }

  const cropH = lastY - firstY + 1;
  const dst = new PNG({ width: w, height: cropH });

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < w; x++) {
      const srcIdx = ((firstY + y) * w + x) * 4;
      const dstIdx = (y * w + x) * 4;
      dst.data[dstIdx] = src.data[srcIdx];
      dst.data[dstIdx + 1] = src.data[srcIdx + 1];
      dst.data[dstIdx + 2] = src.data[srcIdx + 2];
      dst.data[dstIdx + 3] = src.data[srcIdx + 3];
    }
  }

  // Horizontal seamless blending across 32px
  const blendW = 32;
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < blendW; x++) {
      const t = x / blendW;
      const lIdx = (y * w + x) * 4;
      const rIdx = (y * w + (w - blendW + x)) * 4;
      for (let c = 0; c < 4; c++) {
        dst.data[lIdx + c] = Math.round(dst.data[lIdx + c] * t + dst.data[rIdx + c] * (1 - t));
      }
    }
  }

  fs.writeFileSync(outPath, PNG.sync.write(dst));
  console.log(`[Seamless Ground] -> ${outPath} (${w}x${cropH})`);
}

// ---------------------------------------------------------------------------
// 3. Process Subterranean Dirt (Solid textured earth with horizontal wrap)
// ---------------------------------------------------------------------------
function buildDirt(srcPath, outPath) {
  const data = fs.readFileSync(srcPath);
  const src = PNG.sync.read(data);
  const w = src.width, h = src.height;

  let startY = 0, endY = h - 1;
  for (let y = 0; y < h; y++) {
    let nonBlack = 0;
    for (let x = 0; x < w; x++) {
      if (!isNearBlack(src.data[(y * w + x) * 4], src.data[(y * w + x) * 4 + 1], src.data[(y * w + x) * 4 + 2])) {
        nonBlack++;
      }
    }
    if (nonBlack > w * 0.75) {
      startY = y;
      break;
    }
  }

  for (let y = h - 1; y >= startY; y--) {
    let nonBlack = 0;
    for (let x = 0; x < w; x++) {
      if (!isNearBlack(src.data[(y * w + x) * 4], src.data[(y * w + x) * 4 + 1], src.data[(y * w + x) * 4 + 2])) {
        nonBlack++;
      }
    }
    if (nonBlack > w * 0.75) {
      endY = y;
      break;
    }
  }

  const cropH = endY - startY + 1;
  const dst = new PNG({ width: w, height: cropH });

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < w; x++) {
      const srcIdx = ((startY + y) * w + x) * 4;
      const dstIdx = (y * w + x) * 4;
      dst.data[dstIdx] = src.data[srcIdx];
      dst.data[dstIdx + 1] = src.data[srcIdx + 1];
      dst.data[dstIdx + 2] = src.data[srcIdx + 2];
      dst.data[dstIdx + 3] = 255;
    }
  }

  const blendW = 32;
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < blendW; x++) {
      const t = x / blendW;
      const lIdx = (y * w + x) * 4;
      const rIdx = (y * w + (w - blendW + x)) * 4;
      for (let c = 0; c < 3; c++) {
        dst.data[lIdx + c] = Math.round(dst.data[lIdx + c] * t + dst.data[rIdx + c] * (1 - t));
      }
    }
  }

  fs.writeFileSync(outPath, PNG.sync.write(dst));
  console.log(`[Seamless Dirt] -> ${outPath} (${w}x${cropH})`);
}

// Execute for all acts
// Act 2 (Corrupted Lands)
buildPlatform('public/assets/tiles/Act_2/platform.png', 'public/assets/tiles/Act_2/platform_game.png', { minX: 18, maxX: 987, minY: 260, maxY: 535 });
buildSeamlessGround('public/assets/tiles/Act_2/main_ground.png', 'public/assets/tiles/Act_2/ground_seamless_game.png');
buildDirt('public/assets/tiles/Act_2/ground_dirt.png', 'public/assets/tiles/Act_2/dirt_game.png');

// Act 3 (Forgotten Sanctuary)
buildPlatform('public/assets/tiles/Act_3/platform.png', 'public/assets/tiles/Act_3/platform_game.png');
buildSeamlessGround('public/assets/tiles/Act_3/seamless_ground.png', 'public/assets/tiles/Act_3/ground_seamless_game.png');
buildDirt('public/assets/tiles/Act_3/dirt_ground.png', 'public/assets/tiles/Act_3/dirt_game.png');

// Act 4 (Castle Ramparts)
buildPlatform('public/assets/tiles/Act_4/castle_platform.png', 'public/assets/tiles/Act_4/castle_platform_game.png');
buildSeamlessGround('public/assets/tiles/Act_4/castle_seamless_ground.png', 'public/assets/tiles/Act_4/castle_seamless_game.png');
buildDirt('public/assets/tiles/Act_4/castle_dirt.png', 'public/assets/tiles/Act_4/castle_dirt_game.png');

// Act 5 (Shattered Arena)
buildPlatform('public/assets/tiles/Act_5/platform.png', 'public/assets/tiles/Act_5/platform_game.png');
buildSeamlessGround('public/assets/tiles/Act_5/seamless_ground.png', 'public/assets/tiles/Act_5/ground_seamless_game.png');
buildDirt('public/assets/tiles/Act_5/dirt.png', 'public/assets/tiles/Act_5/dirt_game.png');

console.log('>>> All Act 2-5 Tiles & Platforms Built Successfully! <<<');
