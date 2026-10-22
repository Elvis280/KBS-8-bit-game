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

// Function to extract a cluster, remove background with flood fill, and standardize to 96x128
function extractStandardPose(rawObj, startX, endX, forceFacingRight = true) {
  const { width, height, raw } = rawObj;
  const cropW = endX - startX;
  const cropH = height;

  const cropped = new PNG({ width: cropW, height: cropH });
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const sidx = (y * width + (startX + x)) * 3;
      const didx = (y * cropW + x) * 4;
      cropped.data[didx] = raw[sidx];
      cropped.data[didx + 1] = raw[sidx + 1];
      cropped.data[didx + 2] = raw[sidx + 2];
      cropped.data[didx + 3] = 255;
    }
  }

  // Flood fill background from border of cropped region
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
          const r = cropped.data[pidx], g = cropped.data[pidx+1], b = cropped.data[pidx+2];
          const isLight = r > 185 && g > 185 && b > 185;
          const isNeutral = Math.abs(r - g) < 26 && Math.abs(g - b) < 26;
          if (isLight && isNeutral) {
            visited[nidx] = 1;
            queue.push(nidx);
          }
        }
      }
    }
  }

  for (let i = 0; i < cropW * cropH; i++) {
    if (visited[i]) cropped.data[i * 4 + 3] = 0;
  }

  // Find character bounds
  let minX = cropW, maxX = 0, minY = cropH, maxY = 0;
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      if (cropped.data[(y * cropW + x) * 4 + 3] > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const charW = maxX - minX + 1;
  const charH = maxY - minY + 1;

  // Determine facing direction by checking skin tone in upper body
  let leftSkin = 0, rightSkin = 0;
  const upperH = Math.min(charH, Math.round(charH * 0.4));
  for (let y = minY; y < minY + upperH; y++) {
    for (let x = minX; x <= maxX; x++) {
      const idx = (y * cropW + x) * 4;
      if (cropped.data[idx + 3] > 100) {
        const r = cropped.data[idx], g = cropped.data[idx+1], b = cropped.data[idx+2];
        if (r > 180 && g > 130 && b > 100 && r > b) {
          if (x < minX + charW / 2) leftSkin++; else rightSkin++;
        }
      }
    }
  }
  const isFacingLeft = leftSkin > rightSkin;
  const shouldFlip = forceFacingRight && isFacingLeft;

  // Standard canvas: 96 x 128
  const out = new PNG({ width: 96, height: 128 });
  out.data.fill(0);

  // We scale character so character height fits nicely (max ~118px)
  const targetH = Math.min(118, Math.round(charH * (116 / 500)));
  const scale = targetH / charH;
  const targetW = Math.min(94, Math.round(charW * scale));
  const targetLeftX = Math.round((96 - targetW) / 2);
  const targetTopY = Math.round(124 - targetH);

  for (let dy = 0; dy < targetH; dy++) {
    for (let dx = 0; dx < targetW; dx++) {
      const sx = shouldFlip
        ? maxX - Math.floor(dx / scale)
        : minX + Math.floor(dx / scale);
      const sy = minY + Math.floor(dy / scale);

      if (sx >= 0 && sx < cropW && sy >= 0 && sy < cropH) {
        const sidx = (sy * cropW + sx) * 4;
        const didx = ((targetTopY + dy) * 96 + (targetLeftX + dx)) * 4;
        if (cropped.data[sidx + 3] > 0) {
          out.data[didx] = cropped.data[sidx];
          out.data[didx + 1] = cropped.data[sidx + 1];
          out.data[didx + 2] = cropped.data[sidx + 2];
          out.data[didx + 3] = cropped.data[sidx + 3];
        }
      }
    }
  }

  return out;
}

// 1. Attack Combo 1 (hero_normal_attack.png)
const rawAtk1 = loadRaw('public/assets/sprites/hero/hero_normal_attack.png');
const atk1Pose = extractStandardPose(rawAtk1, 767, 1305);
fs.writeFileSync('public/assets/sprites/hero/hero_attack1_game.png', PNG.sync.write(atk1Pose));
console.log('Saved hero_attack1_game.png');

// 2. Attack Combo 2 (hero_diagonal_slash.png)
const rawAtk2 = loadRaw('public/assets/sprites/hero/hero_diagonal_slash.png');
const atk2Pose = extractStandardPose(rawAtk2, 792, 1757);
fs.writeFileSync('public/assets/sprites/hero/hero_attack2_game.png', PNG.sync.write(atk2Pose));
console.log('Saved hero_attack2_game.png');

// 3. Attack Combo 3 Finisher (hero_attack_finisher.png)
const rawAtk3 = loadRaw('public/assets/sprites/hero/hero_attack_finisher.png');
const atk3Pose = extractStandardPose(rawAtk3, 981, 1752);
fs.writeFileSync('public/assets/sprites/hero/hero_attack3_game.png', PNG.sync.write(atk3Pose));
console.log('Saved hero_attack3_game.png');

// 4. Skill Cast (hero_skill_cast.png)
const rawSkill = loadRaw('public/assets/sprites/hero/hero_skill_cast.png');
const skillPose = extractStandardPose(rawSkill, 1270, 1965);
fs.writeFileSync('public/assets/sprites/hero/hero_skill_game.png', PNG.sync.write(skillPose));
console.log('Saved hero_skill_game.png');

// 5. Shield Guard (hero_gaurd.png)
const rawGuard = loadRaw('public/assets/sprites/hero/hero_gaurd.png');
const guardPose = extractStandardPose(rawGuard, 36, 752);
fs.writeFileSync('public/assets/sprites/hero/hero_guard_game.png', PNG.sync.write(guardPose));
console.log('Saved hero_guard_game.png');

// 6. Hurt / Recoil (hero_hurt.png)
const rawHurt = loadRaw('public/assets/sprites/hero/hero_hurt.png');
const hurtPose = extractStandardPose(rawHurt, 107, 1377);
fs.writeFileSync('public/assets/sprites/hero/hero_hurt_game.png', PNG.sync.write(hurtPose));
console.log('Saved hero_hurt_game.png');

// 7. Climbing Cycle (hero_climbing.png) -> 4 frames in a climbing sheet
const rawClimb = loadRaw('public/assets/sprites/hero/hero_climbing.png');
const climbClusters = [
  [18, 359],
  [410, 745],
  [767, 1138],
  [1219, 1517]
];

const climbSheet = new PNG({ width: 96 * 4, height: 128 });
climbSheet.data.fill(0);

climbClusters.forEach(([sx, ex], idx) => {
  const pose = extractStandardPose(rawClimb, sx, ex, false); // Keep natural climbing orientation
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 96; x++) {
      const sidx = (y * 96 + x) * 4;
      const didx = (y * (96 * 4) + (idx * 96 + x)) * 4;
      climbSheet.data[didx] = pose.data[sidx];
      climbSheet.data[didx + 1] = pose.data[sidx + 1];
      climbSheet.data[didx + 2] = pose.data[sidx + 2];
      climbSheet.data[didx + 3] = pose.data[sidx + 3];
    }
  }
});
fs.writeFileSync('public/assets/sprites/hero/hero_climb_sheet_game.png', PNG.sync.write(climbSheet));
console.log('Saved hero_climb_sheet_game.png (4 frames, 384x128)');
