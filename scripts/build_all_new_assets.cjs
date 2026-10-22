const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

// Ensure output directories exist
const DIRS = [
  'public/assets/portraits/game',
  'public/assets/sprites/mascot/game',
  'public/assets/sprites/npcs',
  'public/assets/sprites/Bosses/game'
];
for (const d of DIRS) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

/**
 * High-quality bilinear resize
 */
function resizeBilinear(src, dstW, dstH) {
  const dst = new PNG({ width: dstW, height: dstH });
  const xRatio = src.width / dstW;
  const yRatio = src.height / dstH;

  for (let y = 0; y < dstH; y++) {
    const srcY = (y + 0.5) * yRatio - 0.5;
    const y0 = Math.max(0, Math.floor(srcY));
    const y1 = Math.min(src.height - 1, y0 + 1);
    const yWeight = srcY - y0;

    for (let x = 0; x < dstW; x++) {
      const srcX = (x + 0.5) * xRatio - 0.5;
      const x0 = Math.max(0, Math.floor(srcX));
      const x1 = Math.min(src.width - 1, x0 + 1);
      const xWeight = srcX - x0;

      const idx00 = (y0 * src.width + x0) * 4;
      const idx10 = (y0 * src.width + x1) * 4;
      const idx01 = (y1 * src.width + x0) * 4;
      const idx11 = (y1 * src.width + x1) * 4;

      const dstIdx = (y * dstW + x) * 4;
      for (let c = 0; c < 4; c++) {
        const top = src.data[idx00 + c] * (1 - xWeight) + src.data[idx10 + c] * xWeight;
        const bottom = src.data[idx01 + c] * (1 - xWeight) + src.data[idx11 + c] * xWeight;
        dst.data[dstIdx + c] = Math.round(top * (1 - yWeight) + bottom * yWeight);
      }
    }
  }
  return dst;
}

/**
 * Flood-fill background transparency from borders
 */
function removeBackground(png, options = {}) {
  const w = png.width;
  const h = png.height;
  const visited = new Uint8Array(w * h);
  const queue = [];

  const threshold = options.threshold ?? 185;
  const maxDiff = options.maxDiff ?? 30;

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
    const neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nidx = ny * w + nx;
        if (!visited[nidx]) {
          const pidx = nidx * 4;
          const a = png.data[pidx + 3];
          if (a === 0) {
            visited[nidx] = 1;
            queue.push(nx, ny);
          } else {
            const r = png.data[pidx], g = png.data[pidx + 1], b = png.data[pidx + 2];
            const isBg = r > threshold && g > threshold && b > threshold &&
                         Math.abs(r - g) < maxDiff && Math.abs(g - b) < maxDiff;
            if (isBg) {
              visited[nidx] = 1;
              queue.push(nx, ny);
            }
          }
        }
      }
    }
  }

  // Set visited pixels transparent
  for (let i = 0; i < w * h; i++) {
    if (visited[i]) {
      png.data[i * 4 + 3] = 0;
    }
  }

  return { png, visited };
}

/**
 * Extract content bounds in a frame region
 */
function getContentBounds(png, visited, startX, endX) {
  const w = png.width;
  const h = png.height;
  let minX = endX, maxX = startX, minY = h, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = startX; x < endX; x++) {
      const idx = y * w + x;
      if (!visited[idx] && png.data[idx * 4 + 3] > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (minX > maxX) {
    return { minX: startX, maxX: endX - 1, minY: 0, maxY: h - 1, w: endX - startX, h };
  }
  return { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/**
 * Paste a source region into a target frame canvas with scaling and alignment
 */
function pasteIntoFrame(srcPng, srcBounds, dstCanvas, dstX, dstY, targetW, targetH, options = {}) {
  const baselineDstY = options.baselineDstY ?? targetH - 6;
  const centerDstX = options.centerDstX ?? Math.floor(targetW / 2);
  const pad = options.pad ?? 4;

  const maxDrawW = targetW - pad * 2;
  const maxDrawH = baselineDstY - pad;

  const scale = Math.min(maxDrawW / srcBounds.w, maxDrawH / srcBounds.h);
  const drawW = Math.max(1, Math.round(srcBounds.w * scale));
  const drawH = Math.max(1, Math.round(srcBounds.h * scale));

  const drawX = dstX + Math.round(centerDstX - drawW / 2);
  const drawY = dstY + (baselineDstY - drawH);

  for (let dy = 0; dy < drawH; dy++) {
    const sy = srcBounds.minY + Math.floor(dy / scale);
    if (sy >= srcPng.height) continue;
    const ty = drawY + dy;
    if (ty < 0 || ty >= dstCanvas.height) continue;

    for (let dx = 0; dx < drawW; dx++) {
      const sx = srcBounds.minX + Math.floor(dx / scale);
      if (sx >= srcPng.width) continue;
      const tx = drawX + dx;
      if (tx < 0 || tx >= dstCanvas.width) continue;

      const sidx = (sy * srcPng.width + sx) * 4;
      if (srcPng.data[sidx + 3] < 15) continue;

      const didx = (ty * dstCanvas.width + tx) * 4;
      dstCanvas.data[didx] = srcPng.data[sidx];
      dstCanvas.data[didx + 1] = srcPng.data[sidx + 1];
      dstCanvas.data[didx + 2] = srcPng.data[sidx + 2];
      dstCanvas.data[didx + 3] = srcPng.data[sidx + 3];
    }
  }
}

// ============================================================================
// 1. PROCESS PORTRAITS (Optimize to 256x256 game versions)
// ============================================================================
console.log('\n--- 1. Processing Dialogue Portraits ---');
const portraits = [
  'hero_portrait.png',
  'mascot_portrait.png',
  'elder_robin_portrait.png',
  'captain_valen_portrait.png',
  'preistess_selene_portrait.png',
  'rowan_portrait.png',
  'king_krish_portrait.png'
];

for (const p of portraits) {
  const srcPath = path.join('public/assets/portraits', p);
  if (!fs.existsSync(srcPath)) continue;
  const raw = PNG.sync.read(fs.readFileSync(srcPath));
  const thumb = resizeBilinear(raw, 256, 256);
  const dstPath = path.join('public/assets/portraits/game', p);
  fs.writeFileSync(dstPath, PNG.sync.write(thumb));
  console.log(`[Portrait] ${p} -> game (256x256, ${Math.round(fs.statSync(dstPath).size / 1024)}KB)`);
}

// ============================================================================
// 2. PROCESS MASCOT SPRITES (64x64 per frame)
// ============================================================================
console.log('\n--- 2. Processing Mascot Sprites ---');
{
  // Mascot Idle (3 frames from 2172x724)
  const idleSrcPath = 'public/assets/sprites/mascot/mascot_idle.png';
  if (fs.existsSync(idleSrcPath)) {
    const raw = PNG.sync.read(fs.readFileSync(idleSrcPath));
    const { visited } = removeBackground(raw);
    const fw = Math.floor(raw.width / 3);
    const targetFW = 64;
    const targetFH = 64;
    const sheet = new PNG({ width: targetFW * 3, height: targetFH });
    sheet.data.fill(0);

    for (let f = 0; f < 3; f++) {
      const bounds = getContentBounds(raw, visited, f * fw, (f + 1) * fw);
      pasteIntoFrame(raw, bounds, sheet, f * targetFW, 0, targetFW, targetFH, {
        baselineDstY: 58,
        centerDstX: 32,
        pad: 4
      });
    }

    const dstPath = 'public/assets/sprites/mascot/game/mascot_idle_sheet_game.png';
    fs.writeFileSync(dstPath, PNG.sync.write(sheet));
    console.log(`[Mascot] mascot_idle -> 3 frames @ 64x64 (${Math.round(fs.statSync(dstPath).size / 1024)}KB)`);
  }

  // Mascot Trapped (1 frame from 1536x1024)
  const trappedSrcPath = 'public/assets/sprites/mascot/mascot_trapped.png';
  if (fs.existsSync(trappedSrcPath)) {
    const raw = PNG.sync.read(fs.readFileSync(trappedSrcPath));
    const { visited } = removeBackground(raw);
    const bounds = getContentBounds(raw, visited, 0, raw.width);
    const targetFW = 64;
    const targetFH = 64;
    const frame = new PNG({ width: targetFW, height: targetFH });
    frame.data.fill(0);
    pasteIntoFrame(raw, bounds, frame, 0, 0, targetFW, targetFH, {
      baselineDstY: 58,
      centerDstX: 32,
      pad: 4
    });
    const dstPath = 'public/assets/sprites/mascot/game/mascot_trapped_game.png';
    fs.writeFileSync(dstPath, PNG.sync.write(frame));
    console.log(`[Mascot] mascot_trapped -> 1 frame @ 64x64 (${Math.round(fs.statSync(dstPath).size / 1024)}KB)`);
  }
}

// ============================================================================
// 3. PROCESS NPC OVERWORLD SPRITES (2 frames per NPC @ 96x128)
// ============================================================================
console.log('\n--- 3. Processing Overworld NPCs ---');
const npcs = [
  { file: 'elder_robin_talkand idle.png', out: 'npc_elder_sheet_game.png', name: 'Elder Robin' },
  { file: 'captain_valen_idle_and_alert.png', out: 'npc_guard_sheet_game.png', name: 'Captain Valen' },
  { file: 'preistess_selene_idle_bless.png', out: 'npc_priestess_sheet_game.png', name: 'Priestess Selene' },
  { file: 'rowen_idle_wave.png', out: 'npc_merchant_sheet_game.png', name: 'Rowan Merchant' },
  { file: 'fallen_king_wounded_rebuilding.png', out: 'npc_aurel_sheet_game.png', name: 'King Aurel (NPC)' }
];

for (const npc of npcs) {
  const srcPath = path.join('public/assets/props', npc.file);
  if (!fs.existsSync(srcPath)) continue;
  const raw = PNG.sync.read(fs.readFileSync(srcPath));
  const { visited } = removeBackground(raw);
  const fw = Math.floor(raw.width / 2);

  const targetFW = 96;
  const targetFH = 128;
  const sheet = new PNG({ width: targetFW * 2, height: targetFH });
  sheet.data.fill(0);

  for (let f = 0; f < 2; f++) {
    const bounds = getContentBounds(raw, visited, f * fw, (f + 1) * fw);
    pasteIntoFrame(raw, bounds, sheet, f * targetFW, 0, targetFW, targetFH, {
      baselineDstY: 124, // Feet stand flush at y=124 matching Hero!
      centerDstX: 48,
      pad: 6
    });
  }

  const dstPath = path.join('public/assets/sprites/npcs', npc.out);
  fs.writeFileSync(dstPath, PNG.sync.write(sheet));
  console.log(`[NPC] ${npc.name} -> 2 frames @ 96x128 (${Math.round(fs.statSync(dstPath).size / 1024)}KB)`);
}

// ============================================================================
// 4. PROCESS BOSS SPRITES (192x192 per frame)
// ============================================================================
console.log('\n--- 4. Processing Epic Boss Sprites ---');
const BOSS_W = 192;
const BOSS_H = 192;
const BOSS_BASELINE = 184;

function processBossStrip(srcPath, dstPath, frameCount, bossName) {
  if (!fs.existsSync(srcPath)) return;
  const raw = PNG.sync.read(fs.readFileSync(srcPath));
  const { visited } = removeBackground(raw);
  const fw = Math.floor(raw.width / frameCount);

  const sheet = new PNG({ width: BOSS_W * frameCount, height: BOSS_H });
  sheet.data.fill(0);

  for (let f = 0; f < frameCount; f++) {
    const bounds = getContentBounds(raw, visited, f * fw, (f + 1) * fw);
    pasteIntoFrame(raw, bounds, sheet, f * BOSS_W, 0, BOSS_W, BOSS_H, {
      baselineDstY: BOSS_BASELINE,
      centerDstX: Math.floor(BOSS_W / 2),
      pad: 8
    });
  }

  fs.writeFileSync(dstPath, PNG.sync.write(sheet));
  console.log(`[Boss] ${bossName} (${frameCount}f) -> ${dstPath} (${Math.round(fs.statSync(dstPath).size / 1024)}KB)`);
}

const bossSets = [
  // 1. Treant (Act 1)
  {
    name: 'boss_treant',
    idle: { file: 'boss_treant.png', frames: 1 },
    attack: { file: 'boss_treant_attack.png', frames: 3 },
    flinch: { file: 'boss_treant_flinch.png', frames: 1 },
    defeated: { file: 'boss_treant_defeated.png', frames: 1 }
  },
  // 2. Hydra (Act 2)
  {
    name: 'boss_hydra',
    idle: { file: 'boss_hydra_idle.png', frames: 3 },
    attack: { file: 'boss_hydra_attack.png', frames: 3 },
    flinch: { file: 'boss_hydra_flinch.png', frames: 1 },
    defeated: { file: 'boss_hydra_defeated.png', frames: 3 }
  },
  // 3. Chimera (Act 3)
  {
    name: 'boss_chimera',
    idle: { file: 'boss_chimera_idle.png', frames: 3 },
    attack: { file: 'boss_chimera_attack.png', frames: 3 },
    flinch: { file: 'boss_chimera_flinch.png', frames: 1 },
    defeated: { file: 'boss_chimera_defeated.png', frames: 3 }
  },
  // 4. King Aurel / Krish (Act 4)
  {
    name: 'boss_king_aurel',
    idle: { file: 'king_krish_idle.png', frames: 3 },
    attack: { file: 'boss_krish_attack.png', frames: 3 },
    flinch: { file: 'boss_krish_flinch.png', frames: 1 },
    defeated: { file: 'king_krish_defeated.png', frames: 3 }
  },
  // 5. Void Colossus (Act 5)
  {
    name: 'boss_void_colossus',
    idle: { file: 'boss_void_idle.png', frames: 3 },
    attack: { file: 'boss_void_attack.png', frames: 3 },
    flinch: { file: 'boss_void_flinch.png', frames: 1 },
    defeated: { file: 'boss_void_defeated.png', frames: 3 }
  }
];

for (const b of bossSets) {
  const dir = 'public/assets/sprites/Bosses';
  const outDir = 'public/assets/sprites/Bosses/game';

  processBossStrip(path.join(dir, b.idle.file), path.join(outDir, `${b.name}_idle_game.png`), b.idle.frames, `${b.name} Idle`);
  processBossStrip(path.join(dir, b.attack.file), path.join(outDir, `${b.name}_attack_game.png`), b.attack.frames, `${b.name} Attack`);
  processBossStrip(path.join(dir, b.flinch.file), path.join(outDir, `${b.name}_flinch_game.png`), b.flinch.frames, `${b.name} Flinch`);
  processBossStrip(path.join(dir, b.defeated.file), path.join(outDir, `${b.name}_defeated_game.png`), b.defeated.frames, `${b.name} Defeated`);
}

console.log('\nAll assets built and optimized successfully!');
