const fs = require('fs');
const { PNG } = require('pngjs');

function generateAtlas(imagePath, rowsConfig, outputAtlasPath) {
  const data = fs.readFileSync(imagePath);
  const png = PNG.sync.read(data);
  const w = png.width;
  const h = png.height;
  const totalRows = rowsConfig.length;
  const rowHeight = h / totalRows;

  const frames = {};

  rowsConfig.forEach((rowDef, rowIndex) => {
    const yStart = Math.floor(rowIndex * rowHeight);
    const yEnd = Math.floor((rowIndex + 1) * rowHeight);

    // Find horizontal non-empty clusters
    const colNonEmpty = new Uint8Array(w);
    for (let x = 0; x < w; x++) {
      let count = 0;
      for (let y = yStart; y < yEnd; y++) {
        if (png.data[(y * w + x) * 4 + 3] > 20) count++;
      }
      colNonEmpty[x] = count > 8 ? 1 : 0;
    }

    const clusters = [];
    let s = null;
    for (let x = 0; x < w; x++) {
      if (colNonEmpty[x] && s === null) s = x;
      if (!colNonEmpty[x] && s !== null) {
        if (x - s > 20) clusters.push({ startX: s, endX: x, width: x - s });
        s = null;
      }
    }
    if (s !== null && (w - s) > 20) clusters.push({ startX: s, endX: w, width: w - s });

    // Filter clusters if needed or take up to expected frame count
    const frameCount = rowDef.count || clusters.length;
    const selected = clusters.slice(0, frameCount);

    selected.forEach((cl, fIndex) => {
      const frameKey = `${rowDef.name}_${fIndex}`;
      // Add small 2px padding if possible
      const fx = Math.max(0, cl.startX - 2);
      const fy = Math.max(0, yStart);
      const fw = Math.min(w - fx, cl.width + 4);
      const fh = Math.min(h - fy, Math.floor(rowHeight));

      frames[frameKey] = {
        frame: { x: fx, y: fy, w: fw, h: fh },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: fw, h: fh },
        sourceSize: { w: fw, h: fh }
      };
    });
  });

  const atlas = {
    frames: frames,
    meta: {
      app: 'Lumenfall Atlas Builder',
      version: '1.0',
      image: imagePath.split('/').pop(),
      format: 'RGBA8888',
      size: { w, h },
      scale: 1
    }
  };

  fs.writeFileSync(outputAtlasPath, JSON.stringify(atlas, null, 2));
  console.log(`Generated atlas: ${outputAtlasPath} with ${Object.keys(frames).length} frames`);
}

// 1. Hero Atlas
generateAtlas(
  'public/assets/sprites/hero_sheet.png',
  [
    { name: 'idle', count: 8 },
    { name: 'walk', count: 10 },
    { name: 'run', count: 9 },
    { name: 'jump', count: 8 },
    { name: 'fall', count: 8 },
    { name: 'attack', count: 10 },
    { name: 'hurt', count: 6 },
    { name: 'interact', count: 6 }
  ],
  'public/assets/sprites/hero_atlas.json'
);

// 2. Mascot Atlas
generateAtlas(
  'public/assets/sprites/mascot_sheet.png',
  [
    { name: 'idle', count: 8 },
    { name: 'hop', count: 8 },
    { name: 'fly', count: 7 },
    { name: 'shoulder', count: 7 },
    { name: 'trapped', count: 5 },
    { name: 'expressions', count: 8 }
  ],
  'public/assets/sprites/mascot_atlas.json'
);

// 3. Normal Slimes
generateAtlas(
  'public/assets/sprites/normal_slimes_sheet.png',
  [
    { name: 'green_idle', count: 8 },
    { name: 'green_move', count: 12 },
    { name: 'green_hurt', count: 7 },
    { name: 'green_death', count: 10 },
    { name: 'blue_idle', count: 8 },
    { name: 'blue_move', count: 12 },
    { name: 'blue_hurt', count: 7 },
    { name: 'blue_death', count: 10 }
  ],
  'public/assets/sprites/normal_slimes_atlas.json'
);

// 4. Corrupted Slimes
generateAtlas(
  'public/assets/sprites/corrupted_slime_sheet.png',
  [
    { name: 'c_idle', count: 8 },
    { name: 'c_move', count: 10 },
    { name: 'c_attack', count: 8 },
    { name: 'c_projectile', count: 8 },
    { name: 'c_hurt', count: 8 },
    { name: 'c_death', count: 8 }
  ],
  'public/assets/sprites/corrupted_slime_atlas.json'
);

// 5. King Aurel Boss
generateAtlas(
  'public/assets/sprites/king_aurel_sheet.png',
  [
    { name: 'idle', count: 6 },
    { name: 'walk', count: 8 },
    { name: 'run', count: 7 },
    { name: 'combo', count: 7 },
    { name: 'pulse', count: 7 },
    { name: 'wave', count: 6 },
    { name: 'hurt', count: 6 },
    { name: 'kneel', count: 8 }
  ],
  'public/assets/sprites/king_aurel_atlas.json'
);

// 6. Mascot Boss
generateAtlas(
  'public/assets/sprites/mascot_boss_sheet.png',
  [
    { name: 'idle', count: 7 },
    { name: 'roar', count: 7 },
    { name: 'blast', count: 6 },
    { name: 'recoil', count: 6 },
    { name: 'calm', count: 7 }
  ],
  'public/assets/sprites/mascot_boss_atlas.json'
);

// 7. Royal Guard
generateAtlas(
  'public/assets/sprites/royal_guard_sheet.png',
  [
    { name: 'idle', count: 8 },
    { name: 'walk', count: 8 },
    { name: 'run', count: 8 },
    { name: 'spear_ready', count: 8 },
    { name: 'lower_weapon', count: 8 },
    { name: 'attack_stab', count: 7 },
    { name: 'attack_swing', count: 7 },
    { name: 'hurt_defeat', count: 8 }
  ],
  'public/assets/sprites/royal_guard_atlas.json'
);

// 8. Aurel Epilogue
generateAtlas(
  'public/assets/sprites/aurel_epilogue_sheet.png',
  [
    { name: 'idle', count: 8 },
    { name: 'walk', count: 8 },
    { name: 'run', count: 8 },
    { name: 'lift', count: 6 },
    { name: 'carry', count: 8 },
    { name: 'put_down', count: 7 },
    { name: 'rest', count: 8 },
    { name: 'emotions', count: 8 }
  ],
  'public/assets/sprites/aurel_epilogue_atlas.json'
);
