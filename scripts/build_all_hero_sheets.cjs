const fs = require('fs');
const zlib = require('zlib');
const { PNG } = require('pngjs');

// Standard Game Sprite Specifications
const FRAME_W = 96;
const FRAME_H = 128;
const BASELINE_Y = 124; // Where feet meet the ground
const STANDARD_TORSO_X = 46; // Center of torso in 96px frame
const ATTACK_TORSO_X = 40;   // Slight forward bias to allow slashes to extend to frame edge

/**
 * Fast PNG raw RGB decoder
 */
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
  const raw = Buffer.alloc(width * height * 3);

  for (let y = 0; y < height; y++) {
    const filterType = decompressed[y * stride];
    const rowOffset = y * stride + 1;
    const outRowOffset = y * width * 3;
    const prevOutRowOffset = (y - 1) * width * 3;

    for (let x = 0; x < width * 3; x++) {
      const rawVal = decompressed[rowOffset + x];
      const a = x >= 3 ? raw[outRowOffset + x - 3] : 0;
      const b = y > 0 ? raw[prevOutRowOffset + x] : 0;
      const c = (y > 0 && x >= 3) ? raw[prevOutRowOffset + x - 3] : 0;
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

/**
 * Flood-fills background starting from borders, then filters noise
 */
function cleanCluster(rawObj, startX, endX) {
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

  // Flood fill light neutral background from border
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
    const neighbors = [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < cropW && ny >= 0 && ny < cropH) {
        const nidx = ny * cropW + nx;
        if (!visited[nidx]) {
          const pidx = nidx * 4;
          const r = cropped.data[pidx], g = cropped.data[pidx + 1], b = cropped.data[pidx + 2];
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

  return { cropped, cropW, cropH };
}

/**
 * Extracts a standardized 96x128 frame anchored to ground baseline and torso center
 */
function extractStandardFrame(cleanObj, options = {}) {
  const { cropped, cropW, cropH } = cleanObj;
  const targetTorsoX = options.targetTorsoX ?? STANDARD_TORSO_X;
  const groundY_src = options.groundY_src ?? 711;
  const scale = options.scale ?? 0.232;
  const forceFacingRight = options.forceFacingRight ?? true;
  const overrideTorsoX = options.overrideTorsoX ?? null;

  // Find non-transparent pixel bounds
  let minX = cropW, maxX = 0, minY = cropH, maxY = 0;
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      if (cropped.data[(y * cropW + x) * 4 + 3] > 30) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX > maxX) {
    // Empty frame fallback
    return new PNG({ width: FRAME_W, height: FRAME_H });
  }

  // Calculate Torso Center of Mass (between 35% and 70% height)
  let torsoX = overrideTorsoX;
  if (torsoX === null) {
    let sumX = 0, count = 0;
    const bodyTop = minY + Math.round((maxY - minY) * 0.35);
    const bodyBot = minY + Math.round((maxY - minY) * 0.70);
    for (let y = bodyTop; y <= bodyBot; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (cropped.data[(y * cropW + x) * 4 + 3] > 30) {
          sumX += x;
          count++;
        }
      }
    }
    torsoX = count > 0 ? sumX / count : (minX + maxX) / 2;
  }

  // Check facing direction via upper skin tone
  let leftSkin = 0, rightSkin = 0;
  const upperH = Math.min(maxY - minY + 1, Math.round((maxY - minY + 1) * 0.45));
  for (let y = minY; y < minY + upperH; y++) {
    for (let x = minX; x <= maxX; x++) {
      const idx = (y * cropW + x) * 4;
      if (cropped.data[idx + 3] > 100) {
        const r = cropped.data[idx], g = cropped.data[idx + 1], b = cropped.data[idx + 2];
        if (r > 180 && g > 130 && b > 100 && r > b) {
          if (x < torsoX) leftSkin++; else rightSkin++;
        }
      }
    }
  }
  const isFacingLeft = leftSkin > rightSkin;
  const shouldFlip = forceFacingRight && isFacingLeft;

  const out = new PNG({ width: FRAME_W, height: FRAME_H });
  out.data.fill(0);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const sidx = (y * cropW + x) * 4;
      const alpha = cropped.data[sidx + 3];
      if (alpha > 30) {
        const dx = shouldFlip ? (torsoX - x) : (x - torsoX);
        const dstX = Math.round(targetTorsoX + dx * scale);
        const dstY = Math.round(BASELINE_Y - (groundY_src - y) * scale);

        if (dstX >= 0 && dstX < FRAME_W && dstY >= 0 && dstY < FRAME_H) {
          const didx = (dstY * FRAME_W + dstX) * 4;
          out.data[didx] = cropped.data[sidx];
          out.data[didx + 1] = cropped.data[sidx + 1];
          out.data[didx + 2] = cropped.data[sidx + 2];
          out.data[didx + 3] = alpha;
        }
      }
    }
  }

  return out;
}

/**
 * Saves an array of 96x128 frames into a horizontal spritesheet
 */
function assembleSheet(frames, outPath) {
  const frameCount = frames.length;
  const sheet = new PNG({ width: FRAME_W * frameCount, height: FRAME_H });
  sheet.data.fill(0);

  frames.forEach((frame, idx) => {
    for (let y = 0; y < FRAME_H; y++) {
      for (let x = 0; x < FRAME_W; x++) {
        const sidx = (y * FRAME_W + x) * 4;
        const didx = (y * (FRAME_W * frameCount) + (idx * FRAME_W + x)) * 4;
        sheet.data[didx] = frame.data[sidx];
        sheet.data[didx + 1] = frame.data[sidx + 1];
        sheet.data[didx + 2] = frame.data[sidx + 2];
        sheet.data[didx + 3] = frame.data[sidx + 3];
      }
    }
  });

  fs.writeFileSync(outPath, PNG.sync.write(sheet));
  console.log(`Saved sheet: ${outPath} (${frameCount} frames, ${FRAME_W * frameCount}x${FRAME_H})`);
}

console.log('--- 1. Building Hero Run Sheet & Hero Idle ---');
const runFrames = [];
const RUN_GROUND_Y = 508;
const RUN_SCALE = 116 / 494; // ~0.2348

for (let i = 1; i <= 8; i++) {
  const png = PNG.sync.read(fs.readFileSync(`public/assets/sprites/hero/hero_moving_left_${i}.png`));
  // Compute torso of running frame
  let minY = png.height, maxY = 0, minX = png.width, maxX = 0;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      if (png.data[(y * png.width + x) * 4 + 3] > 30) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  let sumX = 0, count = 0;
  for (let y = minY + Math.round((maxY - minY) * 0.35); y <= minY + Math.round((maxY - minY) * 0.65); y++) {
    for (let x = minX; x <= maxX; x++) {
      if (png.data[(y * png.width + x) * 4 + 3] > 30) {
        sumX += x;
        count++;
      }
    }
  }
  const torsoX = count > 0 ? sumX / count : (minX + maxX) / 2;

  const framePng = new PNG({ width: FRAME_W, height: FRAME_H });
  framePng.data.fill(0);

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const a = png.data[(y * png.width + x) * 4 + 3];
      if (a > 30) {
        // Source faces left, flip around torsoX so hero faces right
        const dstX = Math.round(STANDARD_TORSO_X + (torsoX - x) * RUN_SCALE);
        const dstY = Math.round(BASELINE_Y - (RUN_GROUND_Y - y) * RUN_SCALE);

        if (dstX >= 0 && dstX < FRAME_W && dstY >= 0 && dstY < FRAME_H) {
          const didx = (dstY * FRAME_W + dstX) * 4;
          const sidx = (y * png.width + x) * 4;
          framePng.data[didx] = png.data[sidx];
          framePng.data[didx + 1] = png.data[sidx + 1];
          framePng.data[didx + 2] = png.data[sidx + 2];
          framePng.data[didx + 3] = a;
        }
      }
    }
  }
  runFrames.push(framePng);
}
assembleSheet(runFrames, 'public/assets/sprites/hero/hero_run_sheet_game.png');

// Idle sprite uses Frame 0 of running frames for 100% seamless transition
fs.writeFileSync('public/assets/sprites/hero/hero_idle_game.png', PNG.sync.write(runFrames[0]));
console.log('Saved hero_idle_game.png (96x128, aligned to run cycle)');

console.log('--- 2. Building Hero Jump Sheet (4 frames: crouch, rise, apex, fall) ---');
const rawJump = loadRaw('public/assets/sprites/hero/hero_jump_right.png');
const jumpClusters = [[26, 452], [463, 863], [884, 1319], [1321, 1745]];
const jumpGrounds = [810, 780, 790, 810];
const jumpFrames = jumpClusters.map(([sx, ex], idx) => {
  const cleaned = cleanCluster(rawJump, sx, ex);
  return extractStandardFrame(cleaned, {
    targetTorsoX: STANDARD_TORSO_X,
    groundY_src: jumpGrounds[idx],
    scale: 0.232,
    forceFacingRight: true
  });
});
assembleSheet(jumpFrames, 'public/assets/sprites/hero/hero_jump_sheet_game.png');
fs.writeFileSync('public/assets/sprites/hero/hero_jump_game.png', PNG.sync.write(jumpFrames[1])); // Frame 1 leap fallback

console.log('--- 3. Building Normal Attack Combo 1 (4 frames) ---');
const rawAtk1 = loadRaw('public/assets/sprites/hero/hero_normal_attack.png');
const atk1Clusters = [[11, 340], [374, 733], [768, 1304], [1312, 1632]];
const atk1Frames = atk1Clusters.map(([sx, ex]) => {
  const cleaned = cleanCluster(rawAtk1, sx, ex);
  return extractStandardFrame(cleaned, {
    targetTorsoX: ATTACK_TORSO_X,
    groundY_src: 711,
    scale: 0.232,
    forceFacingRight: false // Already faces right!
  });
});
assembleSheet(atk1Frames, 'public/assets/sprites/hero/hero_attack1_sheet_game.png');
fs.writeFileSync('public/assets/sprites/hero/hero_attack1_game.png', PNG.sync.write(atk1Frames[2]));

console.log('--- 4. Building Diagonal Slash Combo 2 (3 frames) ---');
const rawAtk2 = loadRaw('public/assets/sprites/hero/hero_diagonal_slash.png');
const atk2Clusters = [[18, 367], [400, 729], [796, 1750]];
const atk2Hips = [203, 569, 1311];
const atk2Frames = atk2Clusters.map(([sx, ex], idx) => {
  const cleaned = cleanCluster(rawAtk2, sx, ex);
  return extractStandardFrame(cleaned, {
    targetTorsoX: ATTACK_TORSO_X,
    groundY_src: 750,
    scale: 0.232,
    forceFacingRight: false,
    overrideTorsoX: atk2Hips[idx] - sx
  });
});
assembleSheet(atk2Frames, 'public/assets/sprites/hero/hero_attack2_sheet_game.png');
fs.writeFileSync('public/assets/sprites/hero/hero_attack2_game.png', PNG.sync.write(atk2Frames[2]));

console.log('--- 5. Building Attack Finisher Combo 3 (3 frames) ---');
const rawAtk3 = loadRaw('public/assets/sprites/hero/hero_attack_finisher.png');
const atk3Clusters = [[37, 438], [545, 939], [1037, 1747]];
const atk3Hips = [220, 735, 1498];
const atk3Frames = atk3Clusters.map(([sx, ex], idx) => {
  const cleaned = cleanCluster(rawAtk3, sx, ex);
  return extractStandardFrame(cleaned, {
    targetTorsoX: ATTACK_TORSO_X,
    groundY_src: 690,
    scale: 0.232,
    forceFacingRight: false,
    overrideTorsoX: atk3Hips[idx] - sx
  });
});
assembleSheet(atk3Frames, 'public/assets/sprites/hero/hero_attack3_sheet_game.png');
fs.writeFileSync('public/assets/sprites/hero/hero_attack3_game.png', PNG.sync.write(atk3Frames[2]));

console.log('--- 6. Building Skill Cast (3 frames) ---');
const rawSkill = loadRaw('public/assets/sprites/hero/hero_skill_cast.png');
const skillClusters = [[32, 465], [501, 1247], [1277, 1949]];
const skillFrames = skillClusters.map(([sx, ex]) => {
  const cleaned = cleanCluster(rawSkill, sx, ex);
  return extractStandardFrame(cleaned, {
    targetTorsoX: ATTACK_TORSO_X,
    groundY_src: 744,
    scale: 0.232,
    forceFacingRight: false
  });
});
assembleSheet(skillFrames, 'public/assets/sprites/hero/hero_skill_sheet_game.png');
fs.writeFileSync('public/assets/sprites/hero/hero_skill_game.png', PNG.sync.write(skillFrames[2]));

console.log('--- 7. Building Shield Guard (2 frames) ---');
const rawGuard = loadRaw('public/assets/sprites/hero/hero_gaurd.png');
const guardClusters = [[45, 745], [842, 1700]];
const guardFrames = guardClusters.map(([sx, ex]) => {
  const cleaned = cleanCluster(rawGuard, sx, ex);
  return extractStandardFrame(cleaned, {
    targetTorsoX: STANDARD_TORSO_X,
    groundY_src: 808,
    scale: 0.232,
    forceFacingRight: true
  });
});
assembleSheet(guardFrames, 'public/assets/sprites/hero/hero_guard_sheet_game.png');
fs.writeFileSync('public/assets/sprites/hero/hero_guard_game.png', PNG.sync.write(guardFrames[1]));

console.log('--- 8. Building Hero Hurt Pose ---');
const rawHurt = loadRaw('public/assets/sprites/hero/hero_hurt.png');
const hurtClean = cleanCluster(rawHurt, 104, 1385);
const hurtFrame = new PNG({ width: FRAME_W, height: FRAME_H });
hurtFrame.data.fill(0);
const hurtScale = 0.076;
const centerSrcX = 744;
const centerSrcY = 491;
const centerDstX = 48;
const centerDstY = 64;
for (let y = 0; y < FRAME_H; y++) {
  for (let x = 0; x < FRAME_W; x++) {
    const sx = Math.round(centerSrcX + (x - centerDstX) / hurtScale);
    const sy = Math.round(centerSrcY + (y - centerDstY) / hurtScale);
    if (sx >= 0 && sx < hurtClean.cropW && sy >= 0 && sy < hurtClean.cropH) {
      const sidx = (sy * hurtClean.cropW + sx) * 4;
      const alpha = hurtClean.cropped.data[sidx + 3];
      if (alpha > 30) {
        const didx = (y * FRAME_W + x) * 4;
        hurtFrame.data[didx] = hurtClean.cropped.data[sidx];
        hurtFrame.data[didx + 1] = hurtClean.cropped.data[sidx + 1];
        hurtFrame.data[didx + 2] = hurtClean.cropped.data[sidx + 2];
        hurtFrame.data[didx + 3] = alpha;
      }
    }
  }
}
fs.writeFileSync('public/assets/sprites/hero/hero_hurt_game.png', PNG.sync.write(hurtFrame));
console.log('Saved hero_hurt_game.png (96x128, fully framed and centered)');

console.log('--- 9. Building Hero Climb Sheet (4 frames) ---');
const rawClimb = loadRaw('public/assets/sprites/hero/hero_climbing.png');
const climbClusters = [[18, 359], [410, 745], [767, 1138], [1219, 1517]];
const climbFrames = climbClusters.map(([sx, ex]) => {
  const cleaned = cleanCluster(rawClimb, sx, ex);
  return extractStandardFrame(cleaned, {
    targetTorsoX: STANDARD_TORSO_X,
    groundY_src: 955,
    scale: 0.220,
    forceFacingRight: false
  });
});
assembleSheet(climbFrames, 'public/assets/sprites/hero/hero_climb_sheet_game.png');

console.log('ALL HERO SPRITESHEETS BUILT SUCCESSFULLY WITH MATHEMATICALLY ALIGNED ANCHORS!');
