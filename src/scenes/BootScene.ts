import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    this.add.text(width / 2, height / 2, 'Awakening Lumenfall...', {
      fontFamily: 'Cinzel, serif',
      fontSize: '22px',
      color: '#f59e0b'
    }).setOrigin(0.5);

    // 1. Full Viewport Backgrounds
    this.load.image('bg_act1', '/assets/backgrounds/bg1.png');
    this.load.image('bg1', '/assets/backgrounds/bg1.png');
    this.load.image('bg_act2', '/assets/backgrounds/bg2.png');
    this.load.image('bg2', '/assets/backgrounds/bg2.png');
    this.load.image('bg_act3', '/assets/backgrounds/bg3.png');
    this.load.image('bg3', '/assets/backgrounds/bg3.png');
    this.load.image('bg_act4', '/assets/backgrounds/bg4_exterior.png');
    this.load.image('bg4', '/assets/backgrounds/bg4_exterior.png');
    this.load.image('bg4_exterior', '/assets/backgrounds/bg4_exterior.png');
    this.load.image('bg4_interior', '/assets/backgrounds/bg4_interior.png');
    this.load.image('bg_act5', '/assets/backgrounds/bg5.png');
    this.load.image('bg5', '/assets/backgrounds/bg5.png');
    this.load.image('bg_epilogue', '/assets/backgrounds/epilog-bg.png');
    this.load.image('epilog-bg', '/assets/backgrounds/epilog-bg.png');
    this.load.image('epilog_bg', '/assets/backgrounds/epilog-bg.png');

    // 1b. Ground & Platform Tiles (Act 1)
    this.load.image('ground_act1_tile', '/assets/tiles/Act_1/ground_act1_tile.png');
    this.load.image('ground_act1_seamless', '/assets/tiles/Act_1/ground_act1_seamless.png');
    this.load.image('ground_act1_main', '/assets/tiles/Act_1/ground_act1_main.png');
    this.load.image('ground_act1', '/assets/tiles/Act_1/ground_act1_seamless.png');
    this.load.image('ground_act1_dirt', '/assets/tiles/Act_1/ground_act1_dirt_seamless.png');
    this.load.image('ground_act1_dirt_seamless', '/assets/tiles/Act_1/ground_act1_dirt_seamless.png');
    this.load.image('platform_act1_1', '/assets/tiles/Act_1/platform_act1_1.png');
    this.load.image('platform_act1_2', '/assets/tiles/Act_1/platform_act1_2.png');
    this.load.image('platform_act1_log', '/assets/tiles/Act_1/platform_act1_log.png');
    this.load.image('platform_act1_stone', '/assets/tiles/Act_1/platform_act1_stone.png');
    this.load.image('platform_act1_moss', '/assets/tiles/Act_1/platform_act1_moss.png');

    // 1c. Ground & Platform Tiles (Acts 2 to 5)
    // Act 2 (Corrupted Lands)
    this.load.image('ground_act2_seamless', '/assets/tiles/Act_2/ground_seamless_game.png');
    this.load.image('ground_act2_dirt', '/assets/tiles/Act_2/dirt_game.png');
    this.load.image('platform_act2', '/assets/tiles/Act_2/platform_game.png');
    this.load.image('platform_act2_1', '/assets/tiles/Act_2/platform_act2_1.png');
    this.load.image('platform_act2_2', '/assets/tiles/Act_2/platform_act2_2.png');
    this.load.image('platform_act2_3', '/assets/tiles/Act_2/platform_act2_3.png');

    // Act 3 (Forgotten Sanctuary)
    this.load.image('ground_act3_seamless', '/assets/tiles/Act_3/ground_seamless_game.png');
    this.load.image('ground_act3_dirt', '/assets/tiles/Act_3/dirt_game.png');
    this.load.image('platform_act3', '/assets/tiles/Act_3/platform_game.png');

    // Act 4 (Castle Ramparts)
    this.load.image('ground_act4_seamless', '/assets/tiles/Act_4/castle_seamless_game.png');
    this.load.image('ground_act4_dirt', '/assets/tiles/Act_4/castle_dirt_game.png');
    this.load.image('platform_act4', '/assets/tiles/Act_4/castle_platform_game.png');

    // Act 5 (Shattered Arena)
    this.load.image('ground_act5_seamless', '/assets/tiles/Act_5/ground_seamless_game.png');
    this.load.image('ground_act5_dirt', '/assets/tiles/Act_5/dirt_game.png');
    this.load.image('platform_act5', '/assets/tiles/Act_5/platform_game.png');

    // 2. Hero Raster Sprite Sheets & Action Poses
    this.load.svg('hero_svg', '/assets/svg/hero.svg', { width: 64, height: 88 });
    this.load.svg('hero', '/assets/svg/hero.svg', { width: 64, height: 88 });
    this.load.spritesheet('hero_run', '/assets/sprites/hero/hero_run_sheet_game.png', {
      frameWidth: 96,
      frameHeight: 128
    });
    this.load.spritesheet('hero_climb', '/assets/sprites/hero/hero_climb_sheet_game.png', {
      frameWidth: 96,
      frameHeight: 128
    });
    this.load.spritesheet('hero_jump', '/assets/sprites/hero/hero_jump_sheet_game.png', {
      frameWidth: 96,
      frameHeight: 128
    });
    this.load.spritesheet('hero_attack1', '/assets/sprites/hero/hero_attack1_sheet_game.png', {
      frameWidth: 96,
      frameHeight: 128
    });
    this.load.spritesheet('hero_attack2', '/assets/sprites/hero/hero_attack2_sheet_game.png', {
      frameWidth: 96,
      frameHeight: 128
    });
    this.load.spritesheet('hero_attack3', '/assets/sprites/hero/hero_attack3_sheet_game.png', {
      frameWidth: 96,
      frameHeight: 128
    });
    this.load.spritesheet('hero_skill', '/assets/sprites/hero/hero_skill_sheet_game.png', {
      frameWidth: 96,
      frameHeight: 128
    });
    this.load.spritesheet('hero_guard', '/assets/sprites/hero/hero_guard_sheet_game.png', {
      frameWidth: 96,
      frameHeight: 128
    });
    this.load.image('hero_idle', '/assets/sprites/hero/hero_idle_game.png');
    this.load.image('hero_hurt', '/assets/sprites/hero/hero_hurt_game.png');
    this.load.spritesheet('mascot', '/assets/sprites/mascot/game/mascot_idle_sheet_game.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.image('mascot_trapped', '/assets/sprites/mascot/game/mascot_trapped_game.png');
    this.load.svg('slime', '/assets/svg/slime.svg', { width: 64, height: 56 });
    this.load.svg('coin', '/assets/svg/coin.svg', { width: 24, height: 24 });
    this.load.svg('heart', '/assets/svg/heart.svg', { width: 24, height: 24 });
    this.load.svg('gift', '/assets/svg/gift.svg', { width: 24, height: 24 });

    // 3. Act-Wise Obstacle Boxes & Blocks (SVG - scaled up to 64x64)
    this.load.svg('box_wood', '/assets/svg/box_wood.svg', { width: 64, height: 64 });
    this.load.svg('box_corrupt', '/assets/svg/box_corrupt.svg', { width: 64, height: 64 });
    this.load.svg('box_temple', '/assets/svg/box_temple.svg', { width: 64, height: 64 });
    this.load.svg('box_metal', '/assets/svg/box_metal.svg', { width: 64, height: 64 });
    this.load.svg('box_void', '/assets/svg/box_void.svg', { width: 64, height: 64 });

    // 3B. Dangerous Spike Hazard Boxes (Deal Contact Damage - scaled up to 64x64)
    this.load.svg('box_spike_corrupt', '/assets/svg/box_spike_corrupt.svg', { width: 64, height: 64 });
    this.load.svg('box_spike_temple', '/assets/svg/box_spike_temple.svg', { width: 64, height: 64 });
    this.load.svg('box_spike_metal', '/assets/svg/box_spike_metal.svg', { width: 64, height: 64 });
    this.load.svg('box_spike_void', '/assets/svg/box_spike_void.svg', { width: 64, height: 64 });
    this.load.svg('void_bullet', '/assets/svg/void_bullet.svg', { width: 24, height: 24 });
    this.load.svg('deflected_bullet', '/assets/svg/deflected_bullet.svg', { width: 24, height: 24 });
    this.load.svg('shield', '/assets/svg/shield.svg', { width: 48, height: 48 });
    this.load.svg('shield_pickup', '/assets/svg/shield_pickup.svg', { width: 32, height: 32 });

    // 4. Hero Attack & Skill Visual FX (SVG)
    this.load.svg('slash_combo1', '/assets/svg/slash_combo1.svg', { width: 64, height: 64 });
    this.load.svg('slash_combo2', '/assets/svg/slash_combo2.svg', { width: 64, height: 64 });
    this.load.svg('slash_combo3', '/assets/svg/slash_combo3.svg', { width: 80, height: 80 });
    this.load.svg('skill_wave', '/assets/svg/skill_wave.svg', { width: 96, height: 64 });

    // 5. Interactive NPCs (PNG Spritesheets: 2 frames @ 96x128)
    this.load.spritesheet('npc_elder', '/assets/sprites/npcs/npc_elder_sheet_game.png', {
      frameWidth: 96,
      frameHeight: 128
    });
    this.load.spritesheet('npc_guard', '/assets/sprites/npcs/npc_guard_sheet_game.png', {
      frameWidth: 96,
      frameHeight: 128
    });
    this.load.spritesheet('npc_priestess', '/assets/sprites/npcs/npc_priestess_sheet_game.png', {
      frameWidth: 96,
      frameHeight: 128
    });
    this.load.spritesheet('npc_merchant', '/assets/sprites/npcs/npc_merchant_sheet_game.png', {
      frameWidth: 96,
      frameHeight: 128
    });
    this.load.spritesheet('npc_aurel', '/assets/sprites/npcs/npc_aurel_sheet_game.png', {
      frameWidth: 96,
      frameHeight: 128
    });

    // 6. Environmental Props (SVG)
    this.load.svg('prop_lamp', '/assets/svg/prop_lamp.svg', { width: 32, height: 64 });
    this.load.svg('prop_signpost', '/assets/svg/prop_signpost.svg', { width: 44, height: 56 });
    this.load.svg('prop_torch', '/assets/svg/prop_torch.svg', { width: 32, height: 56 });
    this.load.svg('prop_shrine', '/assets/svg/prop_shrine.svg', { width: 38, height: 64 });
    this.load.svg('prop_flowers', '/assets/svg/prop_flowers.svg', { width: 44, height: 32 });

    // 7. Thematic Setting Buildings & Architectural Props (PNG)
    this.load.image('bldg_act1_cottage', '/assets/props/bldg-act1-cottage.png');
    this.load.image('bldg-act1-cottage', '/assets/props/bldg-act1-cottage.png');

    this.load.image('bldg_act2_crypt', '/assets/props/bldg_act2_crypt.png');
    this.load.image('bldg-act2-crypt', '/assets/props/bldg_act2_crypt.png');

    this.load.image('bldg_act3_temple', '/assets/props/bldg-act3-temple.png');
    this.load.image('bldg-act3-temple', '/assets/props/bldg-act3-temple.png');

    this.load.image('bldg_act4_bastion', '/assets/props/bldg_act4_bastion.png');
    this.load.image('bldg-act4-bastion', '/assets/props/bldg_act4_bastion.png');

    this.load.image('bldg_act5_voidspire', '/assets/props/bldg_act5_voidsphere.png');
    this.load.image('bldg_act5_voidsphere', '/assets/props/bldg_act5_voidsphere.png');
    this.load.image('bldg-act5-voidsphere', '/assets/props/bldg_act5_voidsphere.png');

    this.load.image('bldg_epilogue_pavilion', '/assets/props/bldg_epilogue_pavillion.png');
    this.load.image('bldg_epilogue_pavillion', '/assets/props/bldg_epilogue_pavillion.png');
    this.load.image('bldg-epilogue-pavillion', '/assets/props/bldg_epilogue_pavillion.png');

    // 8. Thematic Interaction Points & Lore Relics (SVG)
    this.load.svg('interact_noticeboard', '/assets/svg/interact_noticeboard.svg', { width: 64, height: 64 });
    this.load.svg('interact_mural', '/assets/svg/interact_mural.svg', { width: 64, height: 64 });
    this.load.svg('interact_lectern', '/assets/svg/interact_lectern.svg', { width: 64, height: 64 });
    this.load.svg('interact_machine', '/assets/svg/interact_machine.svg', { width: 64, height: 64 });
    this.load.svg('interact_anchor', '/assets/svg/interact_anchor.svg', { width: 64, height: 64 });
    this.load.svg('interact_monument', '/assets/svg/interact_monument.svg', { width: 64, height: 64 });

    // 9. Land Elevation Climbing Surfaces (PNG)
    this.load.image('climb_ladder', '/assets/props/climb_ladder.png');
    this.load.image('ladder', '/assets/props/climb_ladder.png');

    // 10. Epic Act Boss Entities (PNG Game Sheets / High-Res Pristine Sprites)
    // Treant (Act 1)
    this.load.image('boss_treant', '/assets/sprites/Bosses/game/boss_treant_idle_game.png');
    this.load.image('boss_treant_attack', '/assets/sprites/Bosses/game/boss_treant_attack_game.png');
    this.load.image('boss_treant_flinch', '/assets/sprites/Bosses/game/boss_treant_flinch_game.png');
    this.load.image('boss_treant_defeated', '/assets/sprites/Bosses/game/boss_treant_defeated_game.png');

    // Hydra (Act 2)
    this.load.image('boss_hydra', '/assets/sprites/Bosses/game/boss_hydra_idle_game.png');
    this.load.image('boss_hydra_attack', '/assets/sprites/Bosses/game/boss_hydra_attack_game.png');
    this.load.image('boss_hydra_flinch', '/assets/sprites/Bosses/game/boss_hydra_flinch_game.png');
    this.load.image('boss_hydra_defeated', '/assets/sprites/Bosses/game/boss_hydra_defeated_game.png');

    // Chimera (Act 3)
    this.load.image('boss_chimera', '/assets/sprites/Bosses/game/boss_chimera_idle_game.png');
    this.load.image('boss_chimera_attack', '/assets/sprites/Bosses/game/boss_chimera_attack_game.png');
    this.load.image('boss_chimera_flinch', '/assets/sprites/Bosses/game/boss_chimera_flinch_game.png');
    this.load.image('boss_chimera_defeated', '/assets/sprites/Bosses/game/boss_chimera_defeated_game.png');

    // King Aurel / Krish (Act 4)
    this.load.image('boss_king_aurel', '/assets/sprites/Bosses/game/boss_king_aurel_idle_game.png');
    this.load.image('boss_king_aurel_attack', '/assets/sprites/Bosses/game/boss_king_aurel_attack_game.png');
    this.load.image('boss_king_aurel_flinch', '/assets/sprites/Bosses/game/boss_king_aurel_flinch_game.png');
    this.load.image('boss_king_aurel_defeated', '/assets/sprites/Bosses/game/boss_king_aurel_defeated_game.png');

    // Void Colossus (Act 5)
    this.load.image('boss_void_colossus', '/assets/sprites/Bosses/game/boss_void_colossus_idle_game.png');
    this.load.image('boss_void_colossus_attack', '/assets/sprites/Bosses/game/boss_void_colossus_attack_game.png');
    this.load.image('boss_void_colossus_flinch', '/assets/sprites/Bosses/game/boss_void_colossus_flinch_game.png');
    this.load.image('boss_void_colossus_defeated', '/assets/sprites/Bosses/game/boss_void_colossus_defeated_game.png');
  }

  create() {
    this.scene.start('TitleScene');
  }
}
