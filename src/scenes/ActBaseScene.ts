import Phaser from 'phaser';
import { gameMaster, GameAct } from '../core/GameMaster';
import { sound } from '../audio/SoundSynth';
import { NPCSpawn, PropSpawn, BuildingSpawn, InteractionPointSpawn, ClimbSurface, BossSpawn, SlimeMonster } from '../core/StrategicLayoutEngine';
import { dialogue, DialogueLine } from '../systems/DialogueDirector';

export interface ActConfig {
  actKey: GameAct;
  actTitle: string;
  bgKey: string;
  worldWidth: number;
  worldHeight: number;
  groundColor: number;
  groundStrokeColor: number;
  groundTileKey?: string;
  groundTileScale?: number;
  groundTileOffsetY?: number;
  groundDirtKey?: string;
  groundDirtScale?: number;
  propOffsetY?: number;
  buildingOffsetY?: number;
  enemyOffsetY?: number;
  groundDecorationKey?: string;
  platformKeys?: string[];
  boxKey: string;
  hazardBoxKey?: string;
  hazardBoxes?: { x: number; y: number }[];
  hazardShoots?: boolean;
  hazardShootInterval?: number;
  hazardBulletSpeed?: number;
  hazardBulletKey?: string;
  groundSegments: { x: number; w: number; y?: number; h?: number }[];
  platforms: { x: number; y: number; w: number }[];
  boxes: { x: number; y: number }[];
  slimes?: SlimeMonster[];
  npcs?: NPCSpawn[];
  props?: PropSpawn[];
  buildings?: BuildingSpawn[];
  interactionPoints?: InteractionPointSpawn[];
  climbSurfaces?: ClimbSurface[];
  boss?: BossSpawn;
  coins: { x: number; y: number }[];
  nextSceneKey: string;
  nextSceneLabel: string;
  createAmbientEffects?: (scene: Phaser.Scene) => void;
}

export abstract class ActBaseScene extends Phaser.Scene {
  protected config: ActConfig;
  protected player!: Phaser.Physics.Arcade.Sprite;
  protected cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  protected keys!: {
    A: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    W: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    Space: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    J: Phaser.Input.Keyboard.Key;
    K: Phaser.Input.Keyboard.Key;
    Z: Phaser.Input.Keyboard.Key;
    X: Phaser.Input.Keyboard.Key;
    Shift: Phaser.Input.Keyboard.Key;
    C: Phaser.Input.Keyboard.Key;
  };

  protected groundGroup!: Phaser.Physics.Arcade.StaticGroup;
  protected platformsGroup!: Phaser.Physics.Arcade.StaticGroup;
  protected boxesGroup!: Phaser.Physics.Arcade.StaticGroup;
  protected hazardBoxesGroup!: Phaser.Physics.Arcade.StaticGroup;
  protected slimesGroup!: Phaser.Physics.Arcade.Group;
  protected hazardBulletsGroup!: Phaser.Physics.Arcade.Group;
  protected deflectedBulletsGroup!: Phaser.Physics.Arcade.Group;
  protected shieldPickupsGroup!: Phaser.Physics.Arcade.Group;
  protected hazardShootTimer?: Phaser.Time.TimerEvent;
  protected coinsGroup!: Phaser.Physics.Arcade.Group;
  protected propsGroup!: Phaser.GameObjects.Group;
  protected npcsGroup!: Phaser.Physics.Arcade.StaticGroup;
  protected buildingsGroup!: Phaser.GameObjects.Group;
  protected interactionPointsGroup!: Phaser.Physics.Arcade.StaticGroup;
  protected climbSurfacesGroup!: Phaser.Physics.Arcade.StaticGroup;
  protected nearbyNPC: Phaser.Physics.Arcade.Sprite | null = null;
  protected nearbyPoint: Phaser.Physics.Arcade.Sprite | null = null;

  // Climbing State & Animation
  protected isClimbing: boolean = false;
  protected isTouchingClimbSurface: boolean = false;
  protected currentClimbSurface: Phaser.GameObjects.GameObject | null = null;
  protected lastClimbSoundTime: number = 0;

  // Boss Battle State
  protected bossSprite: Phaser.Physics.Arcade.Sprite | null = null;
  protected bossHp: number = 0;
  protected bossMaxHp: number = 0;
  protected isBossActive: boolean = false;
  protected isBossDefeated: boolean = false;
  protected bossAttackTimer?: Phaser.Time.TimerEvent;
  protected bossHudEl: HTMLElement | null = null;
  protected bossBarFillEl: HTMLElement | null = null;
  protected bossNameEl: HTMLElement | null = null;
  protected bossPhaseTextEl: HTMLElement | null = null;
  
  // Floating Overhead Boss Health Bar
  protected bossOverheadContainer: Phaser.GameObjects.Container | null = null;
  protected bossOverheadBg: Phaser.GameObjects.Rectangle | null = null;
  protected bossOverheadFill: Phaser.GameObjects.Rectangle | null = null;
  protected bossOverheadDamageBar: Phaser.GameObjects.Rectangle | null = null;
  protected bossOverheadText: Phaser.GameObjects.Text | null = null;
  protected bossOverheadName: Phaser.GameObjects.Text | null = null;
  protected bgImage: Phaser.GameObjects.Image | null = null;

  protected shieldAuraSprite?: Phaser.GameObjects.Sprite;
  protected isGuarding: boolean = false;
  
  protected lastCheckpointX: number = 80;
  protected lastCheckpointY: number = 550;
  protected isTransitioning: boolean = false;
  protected isInvulnerable: boolean = false;
  protected isHurt: boolean = false;

  // Combat Damage & HP Constants
  public static readonly DAMAGE_COMBO_1: number = 15;
  public static readonly DAMAGE_COMBO_2: number = 20;
  public static readonly DAMAGE_COMBO_3: number = 35;
  public static readonly DAMAGE_SKILL: number = 50;

  public static readonly HP_NORMAL_BOX: number = 60;
  public static readonly HP_SPIKED_BOX: number = 150;
  public static readonly HP_NORMAL_SLIME: number = 30;
  public static readonly HP_CORRUPTED_SLIME: number = 80; // +50 HP over normal slime

  // Mascot Companion Follower
  protected mascotCompanion: Phaser.GameObjects.Sprite | null = null;
  protected lastMascotTrailTime: number = 0;

  // Combat: Normal Attack Sequence & Skill Attack State
  protected comboStep: number = 0;
  protected lastAttackTime: number = 0;
  protected comboResetTimer: any = null;
  protected isAttacking: boolean = false;
  protected skillCooldownTime: number = 0;
  protected isSkillActive: boolean = false;
  protected entityHp: Map<Phaser.GameObjects.GameObject, number> = new Map();

  // Combat: Dynamic Skill Interval (-0.15s after every act)
  public getSkillCooldownMs(): number {
    const actKey = this.config.actKey;
    const actOrder: Record<string, number> = {
      'PROLOGUE': 0,
      'ACT_I': 0,
      'ACT_II': 1,
      'ACT_III': 2,
      'ACT_IV': 3,
      'ACT_V': 4,
      'EPILOGUE': 4
    };
    const actIndex = actOrder[actKey] ?? 0;
    // Base 1.00s (1000ms), reduced by 0.15s (150ms) after every act
    return Math.max(300, 1000 - actIndex * 150);
  }

  public get SKILL_COOLDOWN_MS(): number {
    return this.getSkillCooldownMs();
  }

  constructor(sceneKey: string, config: ActConfig) {
    super(sceneKey);
    this.config = config;
  }

  create() {
    this.nearbyNPC = null;
    this.nearbyPoint = null;
    this.isTransitioning = false;
    this.isInvulnerable = false;
    this.isAttacking = false;
    this.isSkillActive = false;
    this.comboStep = 0;
    this.lastCheckpointX = 80;
    this.lastCheckpointY = 550;
    this.isClimbing = false;
    this.isTouchingClimbSurface = false;
    this.currentClimbSurface = null;
    this.entityHp.clear();

    const w = this.config.worldWidth;
    const h = this.config.worldHeight;
    this.physics.world.setBounds(0, 0, w, h + 100);

    // 1. Stretched Full-Viewport Background
    this.createStretchedBackground();

    // 1b. Thematic Setting Architecture & Landmarks (Depth 3)
    this.buildBuildings();

    // 2. Build Solid Ground Segments with Pits & Elevation
    this.buildGroundAndPits();

    // 2b. Vertical Climbing Surfaces / Cliff Ladders
    this.buildClimbSurfaces();

    // 3. Elevated Platforms (Strategic Placement)
    this.buildPlatforms();

    // 3b. Environmental Visual Props (Lamps, shrines, signposts, flowers, torches)
    this.buildProps();

    // 3c. Interactive Friendly NPCs with Dialogues
    this.buildNPCs();

    // 3d. Thematic Lore Interaction Points & Relics
    this.buildInteractionPoints();

    // 4. Obstacle Boxes / Crates (Strategic Placement)
    this.buildObstacleBoxes();

    // 4b. Dangerous Spike Hazard Boxes (Acts II, III, IV, V)
    this.buildHazardBoxes();

    // 4c. Normal Slime Monsters (Easily defeated by 2 normal attacks or 1 skill hit!)
    this.slimesGroup = this.physics.add.group();
    this.buildSlimes();

    // 4d. Hazard Projectile Group & Shooting Interval (Act 5 Void Spikes)
    this.hazardBulletsGroup = this.physics.add.group();
    this.deflectedBulletsGroup = this.physics.add.group();
    this.shieldPickupsGroup = this.physics.add.group();
    if (this.config.hazardShoots) {
      this.startHazardShooting();
    }

    // 5. Collectible Coins
    this.buildCoins();

    // 6. Act Exit Gate / Portal
    this.buildExitGate();

    // 7. Vector Player Character
    this.createPlayer();

    // 7b. Mascot Companion Following Player (if rescued or Acts II-IV, Epilogue)
    this.setupMascotCompanion();

    // 8. Epic Act Boss
    this.buildBoss();

    // 8. Camera Following Player
    this.cameras.main.setBounds(0, 0, w, h);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // 9. Input Controls (WASD + J/Z Normal Attack + K/X Skill Attack + Mouse)
    this.setupInput();

    // 10. Ambient Atmospheric Particles
    if (this.config.createAmbientEffects) {
      this.config.createAmbientEffects(this);
    }

    // 11. Event Listener for Player Defeat (Health Bar Depleted) & Cleanups
    gameMaster.on('player:died', this.onPlayerDied, this);
    this.events.once('shutdown', () => {
      if (this.hazardShootTimer) this.hazardShootTimer.destroy();
      if (this.bossAttackTimer) this.bossAttackTimer.destroy();
      if (this.bossHudEl) this.bossHudEl.classList.add('hidden');
      this.hideInteractionPrompt();
      gameMaster.off('player:died', this.onPlayerDied, this);
    });

    // 12. Ensure player starts with full shield & sync with GameMaster
    gameMaster.playerShield = gameMaster.maxShield;
    gameMaster.setAct(this.config.actKey, this.config.actTitle);
    gameMaster.updateDOMHUD();
  }

  /**
   * Spans the background across the level viewport height (720) with smooth parallax scrolling
   * preserving natural proportions and avoiding black borders!
   */
  protected createStretchedBackground() {
    const w = this.config.worldWidth;
    const h = this.config.worldHeight;

    const bg = this.add.image(0, 0, this.config.bgKey);
    bg.setOrigin(0, 0);

    // Calculate panoramic width and parallax scroll factor so background art maintains
    // natural aesthetic proportions without severe horizontal distortion across 7200px
    const bgWidth = Math.max(1600, Math.min(w + 1400, 2400));
    const maxScroll = Math.max(1, w - 1280);
    const scrollFactor = Math.max(0.05, (bgWidth - 1280) / maxScroll);

    bg.setDisplaySize(bgWidth, h + 140);
    bg.setScrollFactor(scrollFactor, 0);
    bg.setDepth(-100);
    this.bgImage = bg;
  }

  protected buildGroundAndPits() {
    this.groundGroup = this.physics.add.staticGroup();
    const defaultFloorY = 640;

    this.config.groundSegments.forEach((seg, idx) => {
      const groundTopY = seg.y ?? defaultFloorY;
      const height = seg.h ?? (720 - groundTopY + 80);

      const hasGroundSprite = !!(this.config.groundTileKey && this.textures.exists(this.config.groundTileKey));

      const ground = this.add.rectangle(
        seg.x + seg.w / 2,
        groundTopY + height / 2,
        seg.w,
        height,
        this.config.groundColor,
        hasGroundSprite ? 0 : 1
      );
      if (!hasGroundSprite) {
        ground.setStrokeStyle(2, this.config.groundStrokeColor);
      } else {
        ground.setVisible(false);
      }
      this.physics.add.existing(ground, true);
      this.groundGroup.add(ground);

      if (hasGroundSprite) {
        // Tiled textured ground sprite
        const tileScale = this.config.groundTileScale ?? 1.0;
        const offsetY = this.config.groundTileOffsetY ?? Math.round(28 * tileScale);
        const hasDirtSprite = !!(this.config.groundDirtKey && this.textures.exists(this.config.groundDirtKey));

        if (hasDirtSprite) {
          // 1. Top surface grass turf: strictly 1 vertical repetition so flowers and leaves never repeat into the earth!
          const grassSource = this.textures.get(this.config.groundTileKey!).getSourceImage();
          const rawH = grassSource ? (grassSource as any).height || 144 : 144;
          const effectiveH = rawH === 144 ? 140 : rawH;
          const grassHeight = Math.round(effectiveH * tileScale);

          const grassTile = this.add.tileSprite(
            seg.x,
            groundTopY - offsetY,
            seg.w,
            grassHeight,
            this.config.groundTileKey!
          );
          grassTile.setOrigin(0, 0);
          grassTile.setTileScale(tileScale, tileScale);
          grassTile.setDepth(2.1);

          // 2. Subterranean dirt layer: rich earthy dirt extending to the bottom of the world
          const dirtScale = this.config.groundDirtScale ?? 0.75;
          const dirtTopY = groundTopY - offsetY + grassHeight - 2; // 2px overlap to ensure zero visual seams
          const dirtHeight = Math.max(100, (groundTopY + height + 80) - dirtTopY);

          const dirtTile = this.add.tileSprite(
            seg.x,
            dirtTopY,
            seg.w,
            dirtHeight,
            this.config.groundDirtKey!
          );
          dirtTile.setOrigin(0, 0);
          dirtTile.setTileScale(dirtScale, dirtScale);
          dirtTile.setDepth(2.0);
        } else {
          // Fallback single-texture tiling
          const tileSprite = this.add.tileSprite(
            seg.x,
            groundTopY - offsetY,
            seg.w,
            height + offsetY + 60,
            this.config.groundTileKey!
          );
          tileSprite.setOrigin(0, 0);
          tileSprite.setTileScale(tileScale, tileScale);
          tileSprite.setDepth(2);
        }
      } else {
        const topCap = this.add.rectangle(
          seg.x + seg.w / 2,
          groundTopY + 2,
          seg.w,
          6,
          this.config.groundStrokeColor
        );
        topCap.setDepth(2);
      }
    });
  }

  protected buildClimbSurfaces() {
    this.climbSurfacesGroup = this.physics.add.staticGroup();
    if (!this.config.climbSurfaces) return;

    this.config.climbSurfaces.forEach(cs => {
      const mantleDir = (cs as any).mantleDir ?? 1;
      // Position ladder mounted directly against the accessible cliff wall
      const ladderX = mantleDir === 1 ? cs.x - 18 : (mantleDir === -1 ? cs.x + 18 : cs.x);

      // 1. Subtle dark cliff pillar backing
      const cliffBacking = this.add.rectangle(
        ladderX,
        cs.y + cs.height / 2,
        40,
        cs.height,
        0x0f172a,
        0.5
      );
      cliffBacking.setDepth(5);

      // 2. Ladder rungs (textured wooden ladder sprite, width 36px)
      const ladder = this.add.tileSprite(ladderX, cs.y + cs.height / 2, 36, cs.height, 'climb_ladder');
      ladder.setDepth(6);
      this.physics.add.existing(ladder, true);

      const ladderBody = ladder.body as Phaser.Physics.Arcade.StaticBody;
      if (ladderBody) {
        ladderBody.setSize(56, cs.height + 32);
        ladderBody.setOffset(-10, -16);
      }
      this.climbSurfacesGroup.add(ladder);

      ladder.setData('climbX', ladderX);
      ladder.setData('topY', cs.y);
      ladder.setData('bottomY', cs.y + cs.height);
      ladder.setData('mantleDir', mantleDir);
    });
  }

  protected buildPlatforms() {
    this.platformsGroup = this.physics.add.staticGroup();

    this.config.platforms.forEach((p, idx) => {
      const hasPlatformSprites = !!(this.config.platformKeys && this.config.platformKeys.length > 0);

      const plat = this.add.rectangle(
        p.x,
        p.y + 4,
        p.w,
        14,
        this.config.groundColor,
        hasPlatformSprites ? 0 : 0.95
      );
      if (!hasPlatformSprites) {
        plat.setStrokeStyle(1.5, this.config.groundStrokeColor);
      } else {
        plat.setVisible(false);
      }
      this.physics.add.existing(plat, true);
      const body = plat.body as Phaser.Physics.Arcade.StaticBody;
      if (body) body.updateFromGameObject();
      this.platformsGroup.add(plat);

      // Render textured platform image
      if (hasPlatformSprites) {
        const key = this.config.platformKeys![idx % this.config.platformKeys!.length];
        if (this.textures.exists(key)) {
          const platImg = this.add.image(p.x, p.y, key);
          const originMap: Record<string, number> = {
            platform_act1_1: 0.15,
            platform_act1_2: 0.14,
            platform_act1_log: 0.14,
            platform_act1_stone: 0.12,
            platform_act1_moss: 0.23,
            platform_act2: 0.15,
            platform_act3: 0.15,
            platform_act4: 0.15,
            platform_act5: 0.16,
          };
          const originY = originMap[key] ?? 0.16;
          platImg.setOrigin(0.5, originY);
          const targetW = p.w + 20;
          const scale = targetW / platImg.width;
          platImg.setDisplaySize(targetW, platImg.height * scale);
          platImg.setDepth(4);
        }
      }
    });
  }

  protected buildBuildings() {
    this.buildingsGroup = this.add.group();
    if (!this.config.buildings) return;

    const bldgOffsetY = this.config.buildingOffsetY ?? 12;

    this.config.buildings.forEach(b => {
      const bldg = this.add.image(b.x, b.y + bldgOffsetY, b.key);
      const w = b.width || 240;
      const h = b.height || 210;
      bldg.setDisplaySize(w, h);
      bldg.setOrigin(0.5, 1.0); // Foundation rests flush on ground surface!
      bldg.setDepth(3);
      if (b.flipX) bldg.setFlipX(true);

      // Subtle atmospheric micro-animation tailored to setting
      if (b.key.includes('cottage')) {
        this.tweens.add({
          targets: bldg,
          alpha: { from: 0.94, to: 1 },
          duration: 2200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      } else if (b.key.includes('crypt')) {
        this.tweens.add({
          targets: bldg,
          alpha: { from: 0.88, to: 1 },
          duration: 1700,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      } else if (b.key.includes('temple')) {
        this.tweens.add({
          targets: bldg,
          alpha: { from: 0.92, to: 1 },
          duration: 2400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      } else if (b.key.includes('voidspire') || b.key.includes('voidsphere')) {
        this.tweens.add({
          targets: bldg,
          y: b.y - 8,
          duration: 1900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      } else if (b.key.includes('pavilion') || b.key.includes('pavillion')) {
        this.tweens.add({
          targets: bldg,
          alpha: { from: 0.95, to: 1 },
          duration: 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      this.buildingsGroup.add(bldg);
    });
  }

  protected buildProps() {
    this.propsGroup = this.add.group();
    if (!this.config.props) return;

    const propOffsetY = this.config.propOffsetY ?? 12;

    this.config.props.forEach(p => {
      const prop = this.add.image(p.x, p.y + propOffsetY, p.key);
      prop.setOrigin(0.5, 1.0); // Base rests flush on ground surface!
      prop.setDepth(4);
      if (p.scale) prop.setScale(p.scale);
      if (p.flipX) prop.setFlipX(true);

      if (p.key === 'prop_lamp') {
        prop.setDisplaySize(32, 64);
        this.tweens.add({
          targets: prop,
          alpha: { from: 0.82, to: 1 },
          duration: 900 + Math.random() * 400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      } else if (p.key === 'prop_signpost') {
        prop.setDisplaySize(40, 56);
      } else if (p.key === 'prop_torch') {
        prop.setDisplaySize(28, 48);
        this.tweens.add({
          targets: prop,
          scaleY: { from: 1, to: 1.08 },
          scaleX: { from: 1, to: 0.94 },
          duration: 260 + Math.random() * 120,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      } else if (p.key === 'prop_shrine') {
        prop.setDisplaySize(44, 84);
        this.tweens.add({
          targets: prop,
          alpha: { from: 0.85, to: 1 },
          duration: 1600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      } else if (p.key === 'prop_flowers') {
        prop.setDisplaySize(40, 32);
        this.tweens.add({
          targets: prop,
          angle: { from: -3, to: 3 },
          duration: 1400 + Math.random() * 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      this.propsGroup.add(prop);
    });
  }

  protected buildNPCs() {
    this.npcsGroup = this.physics.add.staticGroup();
    if (!this.config.npcs) return;

    const npcOffsetY = this.config.propOffsetY ?? 12;

    this.config.npcs.forEach(n => {
      const textureKey = n.key === 'boss_king_aurel' ? 'npc_aurel' : n.key;
      const isMerchant = n.key === 'npc_merchant';
      const idleFrame = isMerchant ? 0 : 1;
      const talkFrame = isMerchant ? 1 : 0;

      const npc = this.physics.add.staticSprite(n.x, n.y + npcOffsetY, textureKey, idleFrame);
      npc.setOrigin(0.5, 1.0); // Feet stand flush on ground surface!
      npc.setDisplaySize(72, 96);
      npc.setSize(44, 114);
      npc.setOffset(26, 12);
      npc.refreshBody();
      npc.setDepth(9);

      npc.setData('name', n.name);
      npc.setData('lines', n.lines);
      npc.setData('idleFrame', idleFrame);
      npc.setData('talkFrame', talkFrame);
      npc.setData('portrait', n.portrait);

      // Gentle humanoid breathing/idle motion
      this.tweens.add({
        targets: npc,
        scaleY: { from: 1, to: 0.96 },
        duration: 900 + Math.random() * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Ambient overhead storybook nameplate
      const nameplate = this.add.text(n.x, n.y + npcOffsetY - 104, n.name, {
        fontFamily: "'Cinzel', serif, system-ui",
        fontSize: '11px',
        color: '#fdfaf2',
        backgroundColor: '#241c17ee',
        padding: { x: 8, y: 3 }
      });
      nameplate.setOrigin(0.5, 0.5);
      nameplate.setDepth(10);
      nameplate.setStroke('#d97706', 1);

      this.npcsGroup.add(npc);
    });
  }

  protected buildInteractionPoints() {
    this.interactionPointsGroup = this.physics.add.staticGroup();
    if (!this.config.interactionPoints) return;

    const propOffsetY = this.config.propOffsetY ?? 12;

    this.config.interactionPoints.forEach(ip => {
      // If Mascot has already been rescued, do not respawn the trapped debris marker
      if (ip.milestoneId === 'mascot_rescued' && gameMaster.isMilestoneCompleted('mascot_rescued')) {
        return;
      }

      const textureKey = (ip.milestoneId === 'mascot_rescued') ? 'mascot_trapped' : ip.key;
      const point = this.physics.add.staticSprite(ip.x, ip.y + propOffsetY, textureKey);
      point.setOrigin(0.5, 1.0); // Base flush on ground surface!
      point.setDisplaySize(56, 56);
      point.setSize(44, 44);
      point.setOffset(10, 10);
      point.refreshBody();
      point.setDepth(8);

      point.setData('title', ip.title);
      point.setData('promptText', ip.promptText);
      point.setData('milestoneId', ip.milestoneId);
      point.setData('lines', ip.lines);

      // Glowing pulsing beacon overhead
      const beacon = this.add.circle(ip.x, ip.y + propOffsetY - 64, 4, 0xfde047, 0.9);
      beacon.setDepth(11);
      point.setData('beacon', beacon);

      this.tweens.add({
        targets: beacon,
        y: ip.y + propOffsetY - 70,
        scale: 1.35,
        alpha: 0.45,
        duration: 900 + Math.random() * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.interactionPointsGroup.add(point);
    });
  }

  protected buildObstacleBoxes() {
    this.boxesGroup = this.physics.add.staticGroup();

    const propOffsetY = this.config.propOffsetY ?? 12;

    this.config.boxes.forEach(b => {
      // Base resting flush on ground surface: original bottom was at (b.y + propOffsetY + 24)
      // For 64px height with center origin (0.5, 0.5): centerY = (b.y + propOffsetY + 24) - 32 = b.y + propOffsetY - 8
      const box = this.physics.add.staticImage(b.x, b.y + propOffsetY - 8, this.config.boxKey);
      box.setDisplaySize(64, 64);
      box.refreshBody();
      box.setDepth(5);
      this.entityHp.set(box, ActBaseScene.HP_NORMAL_BOX);
      this.boxesGroup.add(box);
    });
  }

  protected buildHazardBoxes() {
    this.hazardBoxesGroup = this.physics.add.staticGroup();
    if (!this.config.hazardBoxes || !this.config.hazardBoxKey) return;

    const propOffsetY = this.config.propOffsetY ?? 12;

    this.config.hazardBoxes.forEach(b => {
      const box = this.physics.add.staticImage(b.x, b.y + propOffsetY - 8, this.config.hazardBoxKey!);
      box.setDisplaySize(64, 64);
      box.refreshBody();
      box.setDepth(5);
      this.entityHp.set(box, ActBaseScene.HP_SPIKED_BOX);
      this.hazardBoxesGroup.add(box);
    });
  }

  protected buildSlimes() {
    if (!this.config.slimes) return;

    this.config.slimes.forEach(s => {
      // Spawn at s.y - 32 so slimes settle cleanly on ground or elevated platforms without embedding
      const spawnY = s.y - 32;
      const slime = this.slimesGroup.create(s.x, spawnY, 'slime') as Phaser.Physics.Arcade.Sprite;
      if (!slime) return;

      const isCorrupted = !!s.isCorrupted;
      slime.setData('isCorrupted', isCorrupted);

      const enemyOffsetY = this.config.enemyOffsetY ?? 12;

      if (isCorrupted) {
        slime.setDisplaySize(68, 60);
        slime.setSize(52, 46);
        slime.setOffset(6, 12 - enemyOffsetY);
        slime.setTint(0xc026d3); // Dark violet / magenta void corruption
        this.entityHp.set(slime, ActBaseScene.HP_CORRUPTED_SLIME); // 80 HP (+50 over normal slime)
        slime.setData('speed', 140); // Aggressive sprint speed
        slime.setData('patrolSpeed', 50);
        slime.setData('aggroRange', 320); // Aggressive detection radius
        slime.setData('contactDamage', 16);
      } else {
        slime.setDisplaySize(58, 50);
        slime.setSize(44, 38);
        slime.setOffset(6, 10 - enemyOffsetY);
        slime.setTint(0xffffff);
        this.entityHp.set(slime, ActBaseScene.HP_NORMAL_SLIME); // 30 HP
        slime.setData('speed', 65);
        slime.setData('patrolSpeed', 45);
        slime.setData('aggroRange', 180);
        slime.setData('contactDamage', 10);
      }

      slime.setDepth(8);

      const body = slime.body as Phaser.Physics.Arcade.Body;
      body.setCollideWorldBounds(true);
      body.setBounce(0.1, 0.1);

      slime.setData('startX', s.x);
      slime.setData('patrolRange', s.patrolRange || 80);
      slime.setData('dir', 1);
      slime.setData('lastHitTime', 0);
      slime.setData('lastPounceTime', 0);
      slime.setData('isAggroed', false);
      slime.setVelocityX(slime.getData('patrolSpeed'));

      // Gelatinous squash & stretch bounce (animates scaleY only to preserve flipX orientation!)
      this.tweens.add({
        targets: slime,
        scaleY: { from: 1, to: 0.86 },
        duration: 380 + Math.random() * 120,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  protected buildCoins() {
    this.coinsGroup = this.physics.add.group();

    this.config.coins.forEach((c, idx) => {
      const coinId = `${this.config.actKey}_coin_${c.x}_${c.y}_${idx}`;
      if (gameMaster.isCoinCollected(coinId)) {
        return;
      }

      const coin = this.coinsGroup.create(c.x, c.y, 'coin') as Phaser.Physics.Arcade.Image;
      coin.setData('coinId', coinId);
      coin.setDisplaySize(24, 24);
      (coin.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      coin.setDepth(6);

      this.tweens.add({
        targets: coin,
        y: c.y - 8,
        duration: 1200 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  protected buildExitGate() {
    const exitX = this.config.worldWidth - 140;
    const exitY = 560;

    const gateFrame = this.add.rectangle(exitX, exitY, 60, 110, 0x0f172a, 0.85);
    gateFrame.setStrokeStyle(3, 0xf59e0b, 0.9);
    gateFrame.setDepth(4);

    const gateCore = this.add.rectangle(exitX, exitY, 44, 94, 0xf59e0b, 0.35);
    gateCore.setDepth(4);
    this.tweens.add({
      targets: gateCore,
      alpha: { from: 0.2, to: 0.7 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    const label = this.add.text(exitX, exitY - 70, this.config.nextSceneLabel, {
      fontFamily: 'Cinzel, serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#fef08a',
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(15);
    label.setStroke('#000', 3);
  }

  protected setupHeroAnimations() {
    if (!this.anims.exists('hero_run')) {
      this.anims.create({
        key: 'hero_run',
        frames: this.anims.generateFrameNumbers('hero_run', { start: 0, end: 7 }),
        frameRate: 14,
        repeat: -1
      });
    }

    if (!this.anims.exists('hero_climb')) {
      this.anims.create({
        key: 'hero_climb',
        frames: this.anims.generateFrameNumbers('hero_climb', { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
      });
    }

    if (!this.anims.exists('hero_idle')) {
      this.anims.create({
        key: 'hero_idle',
        frames: [{ key: 'hero_idle' }],
        frameRate: 1,
        repeat: -1
      });
    }

    if (!this.anims.exists('hero_jump')) {
      this.anims.create({
        key: 'hero_jump',
        frames: this.anims.generateFrameNumbers('hero_jump', { start: 1, end: 3 }),
        frameRate: 6,
        repeat: 0
      });
    }

    if (!this.anims.exists('hero_attack1')) {
      this.anims.create({
        key: 'hero_attack1',
        frames: this.anims.generateFrameNumbers('hero_attack1', { start: 0, end: 3 }),
        frameRate: 18,
        repeat: 0
      });
    }

    if (!this.anims.exists('hero_attack2')) {
      this.anims.create({
        key: 'hero_attack2',
        frames: this.anims.generateFrameNumbers('hero_attack2', { start: 0, end: 2 }),
        frameRate: 15,
        repeat: 0
      });
    }

    if (!this.anims.exists('hero_attack3')) {
      this.anims.create({
        key: 'hero_attack3',
        frames: this.anims.generateFrameNumbers('hero_attack3', { start: 0, end: 2 }),
        frameRate: 11,
        repeat: 0
      });
    }

    if (!this.anims.exists('hero_skill')) {
      this.anims.create({
        key: 'hero_skill',
        frames: this.anims.generateFrameNumbers('hero_skill', { start: 0, end: 2 }),
        frameRate: 14,
        repeat: 0
      });
    }

    if (!this.anims.exists('hero_guard')) {
      this.anims.create({
        key: 'hero_guard',
        frames: this.anims.generateFrameNumbers('hero_guard', { start: 0, end: 1 }),
        frameRate: 5,
        repeat: -1
      });
    }

    if (!this.anims.exists('hero_hurt')) {
      this.anims.create({
        key: 'hero_hurt',
        frames: [{ key: 'hero_hurt' }],
        frameRate: 1,
        repeat: -1
      });
    }
  }

  protected createPlayer() {
    this.setupHeroAnimations();

    this.player = this.physics.add.sprite(80, 550, 'hero_idle');
    this.player.setCollideWorldBounds(false);
    this.player.setDisplaySize(72, 96);
    this.player.setSize(44, 114);
    this.player.setOffset(26, 12);
    this.player.setDepth(10);
    this.player.anims.play('hero_idle');

    this.physics.add.collider(this.player, this.groundGroup);
    this.physics.add.collider(this.player, this.platformsGroup);
    this.physics.add.collider(this.player, this.boxesGroup);

    // Hazard spike boxes deal contact damage (-15 HP) and knockback!
    this.physics.add.collider(this.player, this.hazardBoxesGroup, (_player, hazardObj) => {
      this.handleHazardContact(hazardObj as Phaser.GameObjects.GameObject);
    });

    // Slow-moving hazard bullets deal damage on contact (-12 HP)
    this.physics.add.overlap(this.player, this.hazardBulletsGroup, (_player, bulletObj) => {
      this.handleBulletContact(bulletObj as Phaser.GameObjects.GameObject);
    });

    // Bullets dissolve on hitting ground or elevated platforms
    this.physics.add.collider(this.hazardBulletsGroup, this.groundGroup, (bulletObj) => {
      this.dissolveBullet(bulletObj as Phaser.GameObjects.Image, true);
    });
    this.physics.add.collider(this.hazardBulletsGroup, this.platformsGroup, (bulletObj) => {
      this.dissolveBullet(bulletObj as Phaser.GameObjects.Image, true);
    });

    // Deflected bullets collide with spiked hazard boxes (single-target impact!)
    this.physics.add.overlap(this.deflectedBulletsGroup, this.hazardBoxesGroup, (bulletObj, boxObj) => {
      this.handleDeflectedBulletImpact(bulletObj as Phaser.GameObjects.Image, boxObj as Phaser.GameObjects.Image);
    });

    // Deflected bullets dissolve on ground or platforms
    this.physics.add.collider(this.deflectedBulletsGroup, this.groundGroup, (bulletObj) => {
      this.dissolveBullet(bulletObj as Phaser.GameObjects.Image, true);
    });
    this.physics.add.collider(this.deflectedBulletsGroup, this.platformsGroup, (bulletObj) => {
      this.dissolveBullet(bulletObj as Phaser.GameObjects.Image, true);
    });

    // Player collects shield pickups dropped from destroyed spiked boxes
    this.physics.add.overlap(this.player, this.shieldPickupsGroup, (_player, pickupObj) => {
      this.collectShieldPickup(pickupObj as Phaser.GameObjects.GameObject);
    });

    // Visual radiant shield aura following hero
    this.shieldAuraSprite = this.add.sprite(this.player.x, this.player.y, 'shield');
    this.shieldAuraSprite.setDisplaySize(64, 64);
    this.shieldAuraSprite.setDepth(11);
    this.shieldAuraSprite.setAlpha(0.35);

    this.physics.add.overlap(this.player, this.coinsGroup, (_player, coinObj) => {
      const coin = coinObj as Phaser.GameObjects.GameObject;
      const coinId = (coin.getData && coin.getData('coinId')) || `${this.config.actKey}_bonus_${Date.now()}_${Math.random()}`;
      gameMaster.collectCoin(coinId, 1);
      coin.destroy();
    });

    // Slimes stand and patrol on terrain
    this.physics.add.collider(this.slimesGroup, this.groundGroup);
    this.physics.add.collider(this.slimesGroup, this.platformsGroup);

    // Slime contact with player (hero can guard with Aegis shield, or takes contact damage)
    this.physics.add.overlap(this.player, this.slimesGroup, (_player, slimeObj) => {
      this.handlePlayerSlimeContact(slimeObj as Phaser.Physics.Arcade.Sprite);
    });

    // Vertical climb surfaces / cliff ladders overlap
    if (this.climbSurfacesGroup) {
      this.physics.add.overlap(this.player, this.climbSurfacesGroup, (_player, ladderObj) => {
        this.isTouchingClimbSurface = true;
        this.currentClimbSurface = ladderObj as Phaser.GameObjects.GameObject;
      });
    }
  }

  protected setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = {
      A: this.input.keyboard!.addKey('A'),
      D: this.input.keyboard!.addKey('D'),
      W: this.input.keyboard!.addKey('W'),
      S: this.input.keyboard!.addKey('S'),
      Space: this.input.keyboard!.addKey('SPACE'),
      E: this.input.keyboard!.addKey('E'),
      J: this.input.keyboard!.addKey('J'),
      K: this.input.keyboard!.addKey('K'),
      Z: this.input.keyboard!.addKey('Z'),
      X: this.input.keyboard!.addKey('X'),
      Shift: this.input.keyboard!.addKey('SHIFT'),
      C: this.input.keyboard!.addKey('C')
    };

    // Mouse Controls (Left Click = Normal Combo Attack, Right Click = Skill Attack)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (dialogue.isActive || this.isTransitioning) return;
      if (pointer.leftButtonDown()) {
        this.triggerNormalAttack();
      } else if (pointer.rightButtonDown()) {
        this.triggerSkillAttack();
      }
    });

    if (this.game.canvas) {
      this.game.canvas.oncontextmenu = (e) => e.preventDefault();
    }
  }

  update() {
    if (this.isTransitioning) return;

    if (dialogue.isActive) {
      this.player.setVelocityX(0);
      return;
    }

    // Release ladder climbing state if drifted too far horizontally
    if (this.isClimbing && this.currentClimbSurface && (this.currentClimbSurface as any).active) {
      const climbX = (this.currentClimbSurface as any).getData('climbX') ?? (this.currentClimbSurface as any).x;
      if (Math.abs(this.player.x - climbX) > 48) {
        this.isClimbing = false;
        (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(true);
        this.player.setAngle(0);
      }
    }

    this.handleCombatInput();
    this.updateShieldState();
    this.handlePlayerMovement();
    this.updateMascotCompanion();
    this.updateBoss();
    this.updateSlimes();
    this.checkCheckpointsAndPits();
    this.checkNPCProximity();
    this.checkExitGate();
    this.updateSkillCooldownUI();
  }

  protected handleCombatInput() {
    if (dialogue.isActive) return;
    if (Phaser.Input.Keyboard.JustDown(this.keys.J) || Phaser.Input.Keyboard.JustDown(this.keys.Z)) {
      this.triggerNormalAttack();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.K) || Phaser.Input.Keyboard.JustDown(this.keys.X)) {
      this.triggerSkillAttack();
    }
  }

  /**
   * 3-Hit Normal Attack Sequence:
   * Combo 1: Horizontal arc slash
   * Combo 2: Downward cross slash
   * Combo 3: Radiant piercing finisher with camera shake
   */
  protected triggerNormalAttack() {
    if (this.isAttacking || this.isSkillActive) return;

    const now = this.time.now;
    if (now - this.lastAttackTime < 520 && this.comboStep > 0) {
      this.comboStep = (this.comboStep % 3) + 1;
    } else {
      this.comboStep = 1;
    }
    this.lastAttackTime = now;
    this.isAttacking = true;

    if (this.comboResetTimer) this.comboResetTimer.remove();
    this.comboResetTimer = this.time.delayedCall(550, () => {
      this.comboStep = 0;
    });

    sound.playSlashCombo(this.comboStep);

    const isFacingLeft = this.player.flipX;
    const dir = isFacingLeft ? -1 : 1;

    if (this.comboStep === 1) {
      // Step 1: Swift Horizontal Crescent Slash (4 frames @ 18fps ~ 220ms)
      this.player.anims.play('hero_attack1', true);
      this.player.setAngle(0);
      this.player.setVelocityX(dir * 140);

      const slash = this.add.image(this.player.x + dir * 36, this.player.y - 4, 'slash_combo1');
      slash.setDisplaySize(56, 56);
      slash.setFlipX(isFacingLeft);
      slash.setDepth(15);

      this.tweens.add({
        targets: slash,
        scaleX: isFacingLeft ? -1.1 : 1.1,
        scaleY: 1.1,
        alpha: { from: 1, to: 0 },
        duration: 200,
        onComplete: () => slash.destroy()
      });

      this.checkAttackCollision(this.player.x + dir * 35, this.player.y, 65, ActBaseScene.DAMAGE_COMBO_1);

      this.time.delayedCall(220, () => {
        this.isAttacking = false;
        if (!this.player || !this.player.active || !this.player.body) return;
        this.player.setAngle(0);
        if ((this.player.body as Phaser.Physics.Arcade.Body).onFloor()) {
          const isMoving = this.keys.A.isDown || this.keys.D.isDown || this.cursors.left.isDown || this.cursors.right.isDown;
          if (isMoving) {
            this.player.anims.play('hero_run', true);
          } else {
            this.player.anims.play('hero_idle', true);
          }
        } else {
          this.player.anims.play('hero_jump', true);
        }
      });
    } else if (this.comboStep === 2) {
      // Step 2: Downward Diagonal Cross Slash (3 frames @ 15fps ~ 200ms)
      this.player.anims.play('hero_attack2', true);
      this.player.setAngle(0);
      this.player.setVelocityX(dir * 160);

      const slash = this.add.image(this.player.x + dir * 44, this.player.y + 2, 'slash_combo2');
      slash.setDisplaySize(68, 68);
      slash.setFlipX(isFacingLeft);
      slash.setDepth(15);

      this.tweens.add({
        targets: slash,
        scaleX: isFacingLeft ? -1.2 : 1.2,
        scaleY: 1.2,
        alpha: { from: 1, to: 0 },
        duration: 180,
        onComplete: () => slash.destroy()
      });

      this.checkAttackCollision(this.player.x + dir * 42, this.player.y, 72, ActBaseScene.DAMAGE_COMBO_2);

      this.time.delayedCall(200, () => {
        this.isAttacking = false;
        if (!this.player || !this.player.active || !this.player.body) return;
        this.player.setAngle(0);
        if ((this.player.body as Phaser.Physics.Arcade.Body).onFloor()) {
          const isMoving = this.keys.A.isDown || this.keys.D.isDown || this.cursors.left.isDown || this.cursors.right.isDown;
          if (isMoving) {
            this.player.anims.play('hero_run', true);
          } else {
            this.player.anims.play('hero_idle', true);
          }
        } else {
          this.player.anims.play('hero_jump', true);
        }
      });
    } else {
      // Step 3 Finisher: Heavy Lunging Radiant Thrust (3 frames @ 11fps ~ 270ms)
      this.player.anims.play('hero_attack3', true);
      this.player.setAngle(0);
      this.player.setVelocityX(dir * 260);
      this.player.setTint(0xfef08a);
      this.cameras.main.shake(120, 0.007);

      const slash = this.add.image(this.player.x + dir * 56, this.player.y - 2, 'slash_combo3');
      slash.setDisplaySize(86, 86);
      slash.setFlipX(isFacingLeft);
      slash.setDepth(15);

      this.tweens.add({
        targets: slash,
        scaleX: isFacingLeft ? -1.4 : 1.4,
        scaleY: 1.4,
        alpha: { from: 1, to: 0 },
        duration: 250,
        onComplete: () => slash.destroy()
      });

      this.checkAttackCollision(this.player.x + dir * 52, this.player.y, 88, ActBaseScene.DAMAGE_COMBO_3);

      this.time.delayedCall(270, () => {
        this.isAttacking = false;
        if (!this.player || !this.player.active || !this.player.body) return;
        this.player.clearTint();
        this.player.setAngle(0);
        if ((this.player.body as Phaser.Physics.Arcade.Body).onFloor()) {
          const isMoving = this.keys.A.isDown || this.keys.D.isDown || this.cursors.left.isDown || this.cursors.right.isDown;
          if (isMoving) {
            this.player.anims.play('hero_run', true);
          } else {
            this.player.anims.play('hero_idle', true);
          }
        } else {
          this.player.anims.play('hero_jump', true);
        }
      });
    }
  }

  /**
   * Skill Attack: "Lumen Blade / Heart of Dawn Wave"
   * Emits a high-velocity radiant crescent projectile forward that dissolves upon hitting a single target!
   */
  protected triggerSkillAttack() {
    if (this.time.now < this.skillCooldownTime || this.isSkillActive) return;

    this.isSkillActive = true;
    this.skillCooldownTime = this.time.now + this.getSkillCooldownMs();
    sound.playSkillAttack();

    const isFacingLeft = this.player.flipX;
    const dir = isFacingLeft ? -1 : 1;

    // Hero charging flash
    this.player.setVelocity(0, 0);
    this.player.anims.play('hero_skill', true);
    this.player.setTint(0xfde047);

    this.time.delayedCall(120, () => {
      this.cameras.main.shake(150, 0.01);

      const wave = this.physics.add.sprite(this.player.x + dir * 42, this.player.y - 4, 'skill_wave');
      wave.setDisplaySize(88, 54);
      wave.setSize(64, 40);
      wave.setFlipX(isFacingLeft);
      wave.setDepth(16);
      (wave.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      wave.setVelocityX(dir * 580);

      // Trailing radiant particles
      const trailTimer = this.time.addEvent({
        delay: 50,
        repeat: 11,
        callback: () => {
          if (!wave.active || wave.getData('destroyed')) return;
          const p = this.add.circle(
            wave.x + Phaser.Math.Between(-10, 10),
            wave.y + Phaser.Math.Between(-15, 15),
            Phaser.Math.Between(2, 4),
            0x38bdf8,
            0.8
          );
          p.setDepth(15);
          this.tweens.add({
            targets: p,
            scale: 0,
            alpha: 0,
            duration: 350,
            onComplete: () => p.destroy()
          });
        }
      });

      // Dissolves the wave cleanly on its first single-target impact
      const dissolveWave = (impactX: number, impactY: number) => {
        if (!wave.active || wave.getData('destroyed')) return;
        wave.setData('destroyed', true);
        if (wave.body) {
          (wave.body as Phaser.Physics.Arcade.Body).enable = false;
        }
        trailTimer.destroy();

        // Radiant particle burst on impact
        sound.playHit();
        this.cameras.main.shake(90, 0.006);
        for (let i = 0; i < 9; i++) {
          const spark = this.add.circle(
            impactX + Phaser.Math.Between(-10, 10),
            impactY + Phaser.Math.Between(-10, 10),
            Phaser.Math.Between(2, 5),
            i % 2 === 0 ? 0x38bdf8 : 0xfde047,
            0.9
          );
          spark.setDepth(19);
          const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
          const speed = Phaser.Math.Between(70, 180);
          this.tweens.add({
            targets: spark,
            x: spark.x + Math.cos(angle) * speed * 0.25,
            y: spark.y + Math.sin(angle) * speed * 0.25,
            scale: 0,
            alpha: 0,
            duration: 260 + Phaser.Math.Between(0, 140),
            onComplete: () => spark.destroy()
          });
        }

        wave.destroy();
      };

      // Shatter normal obstacle box on wave impact (single target -> wave dissolves immediately)
      this.physics.add.overlap(wave, this.boxesGroup, (_w, boxObj) => {
        if (!wave.active || wave.getData('destroyed')) return;
        const box = boxObj as Phaser.GameObjects.Image;
        if (!box.active) return;
        const bx = box.x;
        const by = box.y;
        this.entityHp.delete(box);
        this.shatterBox(box, false);
        dissolveWave(bx, by);
      });

      // Spiked hazard box takes 50 skill damage (150 HP total -> exactly 3 skill hits!)
      if (this.hazardBoxesGroup) {
        this.physics.add.overlap(wave, this.hazardBoxesGroup, (_w, boxObj) => {
          if (!wave.active || wave.getData('destroyed')) return;
          const box = boxObj as Phaser.GameObjects.Image;
          if (!box.active) return;

          const currentHp = (this.entityHp.get(box) ?? ActBaseScene.HP_SPIKED_BOX) - ActBaseScene.DAMAGE_SKILL;
          this.entityHp.set(box, currentHp);

          if (currentHp <= 0) {
            this.entityHp.delete(box);
            this.shatterBox(box, true);
          } else {
            sound.playHit();
            box.setTint(0xfde047); // Golden radiant flash on skill impact
            this.tweens.add({
              targets: box,
              x: box.x + Phaser.Math.Between(-5, 5),
              duration: 50,
              yoyo: true,
              repeat: 2,
              onComplete: () => box.clearTint()
            });
          }

          dissolveWave(box.x, box.y);
        });
      }

      // Wave dissolves incoming enemy hazard bullet (single target -> wave dissolves immediately)
      if (this.hazardBulletsGroup) {
        this.physics.add.overlap(wave, this.hazardBulletsGroup, (_w, bulletObj) => {
          if (!wave.active || wave.getData('destroyed')) return;
          const bullet = bulletObj as Phaser.GameObjects.Image;
          if (!bullet.active) return;
          const bx = bullet.x;
          const by = bullet.y;
          this.dissolveBullet(bullet, true);
          dissolveWave(bx, by);
        });
      }

      // Skill wave hits slimes (deals 50 skill damage, single target dissolves wave!)
      if (this.slimesGroup) {
        this.physics.add.overlap(wave, this.slimesGroup, (_w, slimeObj) => {
          if (!wave.active || wave.getData('destroyed')) return;
          const slime = slimeObj as Phaser.Physics.Arcade.Sprite;
          if (!slime.active || slime.getData('defeated')) return;
          const sx = slime.x;
          const sy = slime.y;
          this.hitSlimeWithSkill(slime, ActBaseScene.DAMAGE_SKILL);
          dissolveWave(sx, sy);
        });
      }

      // Skill wave hits active boss (deals 50 damage and dissolves wave!)
      if (this.bossSprite && this.bossSprite.active && !this.isBossDefeated) {
        this.physics.add.overlap(wave, this.bossSprite, () => {
          if (!wave.active || wave.getData('destroyed')) return;
          const bx = this.bossSprite!.x;
          const by = this.bossSprite!.y;
          this.damageBoss(ActBaseScene.DAMAGE_SKILL, true);
          dissolveWave(bx, by);
        });
      }

      // Wave disappears after travel range if no target was struck
      this.time.delayedCall(750, () => {
        if (!wave.getData('destroyed')) {
          trailTimer.destroy();
          if (wave.active) wave.destroy();
        }
      });

      if (this.player && this.player.active && this.player.body) {
        this.player.clearTint();
        this.isSkillActive = false;
        if ((this.player.body as Phaser.Physics.Arcade.Body).onFloor()) {
          const isMoving = this.keys.A.isDown || this.keys.D.isDown || this.cursors.left.isDown || this.cursors.right.isDown;
          if (isMoving) {
            this.player.anims.play('hero_run', true);
          } else {
            this.player.anims.play('hero_idle', true);
          }
        } else {
          this.player.anims.play('hero_jump', true);
        }
      } else {
        this.isSkillActive = false;
      }
    });
  }

  protected checkAttackCollision(centerX: number, centerY: number, reach: number, damage: number = ActBaseScene.DAMAGE_COMBO_1) {
    const attackBox = new Phaser.Geom.Rectangle(centerX - reach / 2, centerY - 45, reach, 90);

    const checkGroup = (group: Phaser.Physics.Arcade.StaticGroup, isHazard: boolean) => {
      if (!group) return;
      const boxes = group.getChildren() as Phaser.GameObjects.Image[];
      for (const box of boxes) {
        if (!box.active) continue;
        const bounds = box.getBounds();
        if (Phaser.Geom.Intersects.RectangleToRectangle(attackBox, bounds)) {
          if (isHazard) {
            // Spiked boxes are immune to physical melee slashing (0 damage)
            sound.playShieldBlock();
            box.setTint(0x94a3b8);
            this.tweens.add({
              targets: box,
              x: box.x + Phaser.Math.Between(-3, 3),
              duration: 40,
              yoyo: true,
              repeat: 1,
              onComplete: () => box.clearTint()
            });
            continue;
          }

          // Normal boxes take combo damage (60 HP total)
          const currentHp = (this.entityHp.get(box) ?? ActBaseScene.HP_NORMAL_BOX) - damage;
          this.entityHp.set(box, currentHp);

          if (currentHp <= 0) {
            this.entityHp.delete(box);
            this.shatterBox(box, false);
          } else {
            sound.playHit();
            box.setTint(0xffffff);
            this.tweens.add({
              targets: box,
              x: box.x + Phaser.Math.Between(-4, 4),
              duration: 50,
              yoyo: true,
              repeat: 2,
              onComplete: () => box.clearTint()
            });
          }
        }
      }
    };

    checkGroup(this.boxesGroup, false);
    checkGroup(this.hazardBoxesGroup, true);

    // Sword slash dissolves incoming hazard bullets
    if (this.hazardBulletsGroup) {
      const bullets = this.hazardBulletsGroup.getChildren() as Phaser.GameObjects.Image[];
      for (const bullet of bullets) {
        if (!bullet.active) continue;
        if (Phaser.Geom.Intersects.RectangleToRectangle(attackBox, bullet.getBounds())) {
          this.dissolveBullet(bullet, true);
        }
      }
    }

    // Sword slash damages slimes (30 HP total: Combo 1 (15) + Combo 2 (20) = 35 >= 30, defeated in 2 hits!)
    if (this.slimesGroup) {
      const slimes = this.slimesGroup.getChildren() as Phaser.Physics.Arcade.Sprite[];
      for (const slime of slimes) {
        if (!slime.active || slime.getData('defeated')) continue;
        if (Phaser.Geom.Intersects.RectangleToRectangle(attackBox, slime.getBounds())) {
          this.hitSlimeWithNormalAttack(slime, damage);
        }
      }
    }

    // Sword slash damages active boss
    if (this.bossSprite && this.bossSprite.active && !this.isBossDefeated) {
      if (Phaser.Geom.Intersects.RectangleToRectangle(attackBox, this.bossSprite.getBounds())) {
        this.damageBoss(damage, false);
      }
    }
  }

  protected shatterBox(box: Phaser.GameObjects.Image, isHazard: boolean = false) {
    if (!box.active) return;
    this.entityHp.delete(box);
    sound.playBoxBreak();
    this.cameras.main.shake(isHazard ? 100 : 70, isHazard ? 0.008 : 0.005);

    const bx = box.x;
    const by = box.y;
    box.destroy();

    // Shatter debris particles (red/crimson danger shards for hazard boxes)
    const shardColor = isHazard ? 0xef4444 : this.config.groundStrokeColor;
    const count = isHazard ? 10 : 7;
    for (let i = 0; i < count; i++) {
      const shard = this.add.rectangle(
        bx + Phaser.Math.Between(-14, 14),
        by + Phaser.Math.Between(-14, 14),
        Phaser.Math.Between(5, 12),
        Phaser.Math.Between(5, 12),
        shardColor
      );
      shard.setDepth(18);

      const vx = Phaser.Math.Between(-180, 180);

      this.tweens.add({
        targets: shard,
        x: shard.x + vx * 0.45,
        y: shard.y + 130,
        angle: Phaser.Math.Between(-180, 180),
        alpha: { from: 1, to: 0 },
        duration: 400 + Phaser.Math.Between(0, 200),
        onComplete: () => shard.destroy()
      });
    }

    // Dropping a protective Shield Powerup when a spiked hazard box is destroyed (25% drop rate!)
    if (isHazard && Math.random() < 0.25) {
      const shieldOrb = this.shieldPickupsGroup.create(bx, by - 12, 'shield_pickup') as Phaser.Physics.Arcade.Image;
      shieldOrb.setDisplaySize(32, 32);
      (shieldOrb.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      shieldOrb.setDepth(15);
      this.tweens.add({
        targets: shieldOrb,
        y: by - 24,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // 40% chance to drop bonus coin (55% for hazard boxes)
    if (Math.random() < (isHazard ? 0.55 : 0.4)) {
      const bonusCoin = this.coinsGroup.create(bx, by - 8, 'coin') as Phaser.Physics.Arcade.Image;
      bonusCoin.setDisplaySize(24, 24);
      (bonusCoin.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      bonusCoin.setDepth(6);
      sound.playCoin();
    }
  }

  protected updateSkillCooldownUI() {
    const skillProgress = document.getElementById('skill-progress');
    const skillPill = document.getElementById('skill-pill');
    const skillText = document.getElementById('skill-text');

    if (!skillProgress || !skillPill) return;

    const cooldown = this.getSkillCooldownMs();
    const remaining = this.skillCooldownTime - this.time.now;
    if (remaining > 0) {
      const pct = Math.max(0, Math.min(100, (1 - remaining / cooldown) * 100));
      skillProgress.style.width = `${pct}%`;
      skillPill.classList.remove('ready');
      skillPill.classList.add('cooling');
      if (skillText) skillText.textContent = `${(remaining / 1000).toFixed(2)}s`;
    } else {
      skillProgress.style.width = '100%';
      skillPill.classList.add('ready');
      skillPill.classList.remove('cooling');
      if (skillText) {
        const cdSec = (cooldown / 1000).toFixed(2);
        skillText.textContent = `LUMEN BLADE (${cdSec}s)`;
      }
    }
  }

  protected handlePlayerMovement() {
    if (dialogue.isActive) {
      this.player.setVelocityX(0);
      return;
    }
    // If hero is in hurt recoil flinch, lock out movement so the hurt posture and knockback carry through!
    if (this.isHurt) {
      return;
    }
    // If currently performing attack thrust or skill charging, don't override velocity with movement keys
    if (this.isAttacking || this.isSkillActive) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const onFloor = body.blocked.down || body.touching.down;

    // --- Dynamic Climbing Mechanics & Animation ---
    // Direct synchronous check for ladder overlap
    let overlappingLadder: Phaser.GameObjects.GameObject | null = null;
    if (this.climbSurfacesGroup) {
      this.physics.overlap(this.player, this.climbSurfacesGroup, (_player, ladderObj) => {
        overlappingLadder = ladderObj as Phaser.GameObjects.GameObject;
      });
    }

    if (overlappingLadder) {
      this.isTouchingClimbSurface = true;
      this.currentClimbSurface = overlappingLadder;
    } else {
      this.isTouchingClimbSurface = false;
    }

    const isPressingUp = this.keys.W.isDown || this.cursors.up.isDown;
    const isPressingDown = this.keys.S.isDown || this.cursors.down.isDown;

    if (this.isTouchingClimbSurface && (isPressingUp || (isPressingDown && !onFloor))) {
      this.isClimbing = true;
    }

    if (this.isClimbing) {
      body.setAllowGravity(false);

      if (this.currentClimbSurface) {
        const climbX = (this.currentClimbSurface as any).getData('climbX') ?? (this.currentClimbSurface as any).x;
        this.player.x = Phaser.Math.Linear(this.player.x, climbX, 0.25);

        // Summit Mantle Hop
        const topY = (this.currentClimbSurface as any).getData('topY') ?? (this.currentClimbSurface as any).y;
        if (this.player.y <= topY + 16 && isPressingUp) {
          const mantleDir = (this.currentClimbSurface as any).getData('mantleDir') ?? 1;
          this.isClimbing = false;
          body.setAllowGravity(true);
          this.player.setVelocityY(-260);
          this.player.setVelocityX(mantleDir * 180);
          this.player.setAngle(0);
          sound.playJump();
          return;
        }
      }

      // Wall-jump leap off ladder with Space
      if (Phaser.Input.Keyboard.JustDown(this.keys.Space)) {
        this.isClimbing = false;
        body.setAllowGravity(true);
        const leapDir = this.keys.A.isDown ? -1 : (this.keys.D.isDown ? 1 : (this.player.flipX ? 1 : -1));
        this.player.setVelocityY(-400);
        this.player.setVelocityX(leapDir * 240);
        this.player.setAngle(0);
        sound.playJump();
        return;
      }

      // Vertical Climbing Movement & Hero Climbing Animation
      if (isPressingUp) {
        this.player.setVelocityY(-160);
        this.player.anims.play('hero_climb', true);
        this.player.setAngle(0);
        if (this.time.now - this.lastClimbSoundTime > 230) {
          sound.playClimb();
          this.lastClimbSoundTime = this.time.now;
        }
      } else if (isPressingDown) {
        this.player.setVelocityY(160);
        this.player.anims.play('hero_climb', true);
        this.player.setAngle(0);
        if (this.time.now - this.lastClimbSoundTime > 230) {
          sound.playClimb();
          this.lastClimbSoundTime = this.time.now;
        }
        if (onFloor) {
          this.isClimbing = false;
          body.setAllowGravity(true);
          this.player.setAngle(0);
          this.player.anims.play('hero_idle', true);
        }
      } else {
        this.player.setVelocityY(0);
        this.player.anims.stop();
        this.player.setAngle(0);
      }

      this.player.setVelocityX(0);
      return;
    } else {
      body.setAllowGravity(true);
    }
    // --- End Climbing Mechanics ---

    const speed = this.isGuarding ? 140 : 280;

    if (this.keys.A.isDown || this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
      if (this.isGuarding) {
        this.player.anims.play('hero_guard', true);
        this.player.setAngle(0);
      } else if (onFloor && !this.isAttacking) {
        this.player.anims.play('hero_run', true);
        this.player.setAngle(0);
      }
    } else if (this.keys.D.isDown || this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
      if (this.isGuarding) {
        this.player.anims.play('hero_guard', true);
        this.player.setAngle(0);
      } else if (onFloor && !this.isAttacking) {
        this.player.anims.play('hero_run', true);
        this.player.setAngle(0);
      }
    } else {
      if (!this.isAttacking) {
        this.player.setVelocityX(0);
        this.player.setAngle(0);
        if (this.isGuarding) {
          this.player.anims.play('hero_guard', true);
        } else if (onFloor && !this.isInvulnerable) {
          this.player.anims.play('hero_idle', true);
        }
      }
    }

    if ((this.keys.W.isDown || this.keys.Space.isDown || this.cursors.up.isDown) && onFloor) {
      this.player.setVelocityY(-460);
      sound.playJump();
      if (!this.isGuarding && !this.isAttacking) {
        this.player.anims.play('hero_jump', true);
      }
      this.player.setAngle(0);
    } else if (!onFloor && !this.isClimbing && !this.isAttacking && !this.isGuarding && !this.isHurt) {
      const vy = body.velocity.y;
      if (vy > 140) {
        if (this.player.anims.isPlaying) this.player.anims.stop();
        if (this.player.texture.key !== 'hero_jump' || (this.player.frame && this.player.frame.name !== '3')) {
          this.player.setTexture('hero_jump', 3);
        }
      } else if (!this.player.anims.isPlaying || this.player.anims.currentAnim?.key !== 'hero_jump') {
        this.player.anims.play('hero_jump', true);
      }
      this.player.setAngle(0);
    }
  }

  protected checkCheckpointsAndPits() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const onFloor = body.blocked.down || body.touching.down;

    if (onFloor && this.player.y < 670) {
      this.lastCheckpointX = this.player.x;
      this.lastCheckpointY = this.player.y - 10;
    }

    if (this.player.y > 700 && !this.isInvulnerable) {
      this.handlePitFall();
    }
  }

  protected startHazardShooting() {
    const interval = this.config.hazardShootInterval || 2000;
    this.hazardShootTimer = this.time.addEvent({
      delay: interval,
      loop: true,
      callback: () => {
        this.fireHazardBullets();
      }
    });
  }

  protected fireHazardBullets() {
    if (!this.hazardBoxesGroup || this.isTransitioning) return;

    const boxes = this.hazardBoxesGroup.getChildren() as Phaser.GameObjects.Image[];
    const bulletKey = this.config.hazardBulletKey || 'void_bullet';
    const speed = this.config.hazardBulletSpeed || 110;

    let firedAny = false;

    for (const box of boxes) {
      if (!box.active) continue;

      // Only fire if the hero is within active gameplay range (<= 850px)
      const dist = Phaser.Math.Distance.Between(box.x, box.y, this.player.x, this.player.y);
      if (dist > 850) continue;

      // Aim towards hero's center torso
      const dx = this.player.x - box.x;
      const dy = (this.player.y - 10) - box.y;
      const angle = Math.atan2(dy, dx);

      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const bullet = this.hazardBulletsGroup.create(box.x, box.y - 6, bulletKey) as Phaser.Physics.Arcade.Image;
      if (!bullet) continue;

      bullet.setDisplaySize(24, 24);
      (bullet.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      bullet.setVelocity(vx, vy);
      bullet.setDepth(14);
      bullet.setAlpha(0.95);

      firedAny = true;

      // Continuous rotation tween for the void bullet
      this.tweens.add({
        targets: bullet,
        angle: 360,
        duration: 1600,
        repeat: -1
      });

      // Subtle pulse scale
      this.tweens.add({
        targets: bullet,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 400,
        yoyo: true,
        repeat: -1
      });

      // Trailing faint void particles
      const pTimer = this.time.addEvent({
        delay: 100,
        repeat: 24,
        callback: () => {
          if (!bullet.active) {
            pTimer.destroy();
            return;
          }
          const p = this.add.circle(
            bullet.x + Phaser.Math.Between(-3, 3),
            bullet.y + Phaser.Math.Between(-3, 3),
            Phaser.Math.Between(2, 3),
            0xec4899,
            0.6
          );
          p.setDepth(13);
          this.tweens.add({
            targets: p,
            scale: 0,
            alpha: 0,
            duration: 300,
            onComplete: () => p.destroy()
          });
        }
      });

      // Self-destruct after 5 seconds if not impacted
      this.time.delayedCall(5000, () => {
        pTimer.destroy();
        if (bullet.active) {
          this.dissolveBullet(bullet, false);
        }
      });
    }

    if (firedAny) {
      sound.playVoidShoot();
    }
  }

  /**
   * Hero Hurt & Flinch Recoil State
   * Locks out movement during flinch knockback and reliably displays the hero_hurt posture!
   */
  protected triggerHeroHurt(knockbackVx: number, knockbackVy: number, duration: number = 380) {
    if (this.isTransitioning) return;
    this.isHurt = true;
    this.isInvulnerable = true;
    this.isClimbing = false;
    (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(true);

    sound.playHit();
    this.cameras.main.shake(130, 0.008);

    // Play hurt posture and knockback velocity
    this.player.anims.play('hero_hurt', true);
    if (knockbackVx !== 0) {
      // Facing: sprite faces right by default while recoiling to the left.
      // If knocked to the right (Vx > 0), face left (flipX = true).
      // If knocked to the left (Vx < 0), face right (flipX = false).
      this.player.setFlipX(knockbackVx > 0);
    }
    this.player.setVelocity(knockbackVx, knockbackVy);
    this.player.setTint(0xef4444);

    // Flash invulnerability tween
    this.tweens.add({
      targets: this.player,
      alpha: { from: 0.25, to: 1 },
      duration: 100,
      repeat: 6,
      onComplete: () => {
        if (this.player && this.player.active) {
          this.player.setAlpha(1);
          this.player.clearTint();
        }
        this.isInvulnerable = false;
      }
    });

    // Flinch recoil duration lock
    this.time.delayedCall(duration, () => {
      this.isHurt = false;
      if (!this.player || !this.player.active || !this.player.body) return;
      this.player.clearTint();
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      if (body && body.onFloor()) {
        const isMoving = this.keys.A.isDown || this.keys.D.isDown || this.cursors.left.isDown || this.cursors.right.isDown;
        if (isMoving) {
          this.player.anims.play('hero_run', true);
        } else {
          this.player.anims.play('hero_idle', true);
        }
      } else {
        this.player.anims.play('hero_jump', true);
      }
    });
  }

  protected handleBulletContact(bulletObj: Phaser.GameObjects.GameObject) {
    const bullet = bulletObj as Phaser.GameObjects.Image;
    if (!bullet.active || bullet.getData('destroyed') || this.isInvulnerable || this.isTransitioning) return;

    if (this.isGuarding) {
      // Actively guarding with Aegis Shield: Deflect bullet!
      bullet.setData('destroyed', true);
      this.dissolveBullet(bullet, false);

      sound.playShieldBlock();
      this.cameras.main.shake(70, 0.005);

      this.spawnDeflectedBullet(this.player.x, this.player.y - 8);
      return;
    }

    // Single-target damage (absorbed by shield or damages health)
    bullet.setData('destroyed', true);
    this.dissolveBullet(bullet, true);

    gameMaster.damagePlayer(12);

    // Recoil knockback away from bullet
    const recoilDir = this.player.x < bullet.x ? -1 : 1;
    this.triggerHeroHurt(recoilDir * 180, -200, 360);
  }

  protected dissolveBullet(bullet: Phaser.GameObjects.Image, impact: boolean = true) {
    if (!bullet || !bullet.active || bullet.getData('destroyed')) return;
    bullet.setData('destroyed', true);
    const bx = bullet.x;
    const by = bullet.y;
    bullet.destroy();

    if (impact) {
      sound.playHit();
    }

    // Spark dissipation particles
    for (let i = 0; i < 5; i++) {
      const spark = this.add.circle(
        bx + Phaser.Math.Between(-6, 6),
        by + Phaser.Math.Between(-6, 6),
        Phaser.Math.Between(2, 4),
        0xec4899,
        0.8
      );
      spark.setDepth(16);
      this.tweens.add({
        targets: spark,
        x: spark.x + Phaser.Math.Between(-25, 25),
        y: spark.y + Phaser.Math.Between(-25, 25),
        scale: 0,
        alpha: 0,
        duration: 250,
        onComplete: () => spark.destroy()
      });
    }
  }

  protected updateShieldState() {
    const wasGuarding = this.isGuarding;
    this.isGuarding = (this.keys.Shift?.isDown || this.keys.C?.isDown) && gameMaster.playerShield > 0;

    if (this.isGuarding) {
      this.player.anims.play('hero_guard', true);
    } else if (wasGuarding && !this.isAttacking && (this.player.body as Phaser.Physics.Arcade.Body).onFloor()) {
      this.player.anims.play('hero_idle', true);
    }

    if (this.shieldAuraSprite && this.player.active) {
      this.shieldAuraSprite.setPosition(this.player.x, this.player.y - 4);

      if (this.isGuarding) {
        this.shieldAuraSprite.setAlpha(0.88);
        this.shieldAuraSprite.setTint(0xfde047);
        this.shieldAuraSprite.setScale(1.4 + Math.sin(this.time.now * 0.015) * 0.08);
      } else if (gameMaster.playerShield > 0) {
        this.shieldAuraSprite.setAlpha(0.35);
        this.shieldAuraSprite.setTint(0x38bdf8);
        this.shieldAuraSprite.setScale(1.15);
      } else {
        this.shieldAuraSprite.setAlpha(0);
      }
    }
  }

  protected spawnDeflectedBullet(x: number, y: number) {
    const defBullet = this.deflectedBulletsGroup.create(x, y, 'deflected_bullet') as Phaser.Physics.Arcade.Image;
    if (!defBullet) return;

    defBullet.setDisplaySize(24, 24);
    (defBullet.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    defBullet.setDepth(15);

    // Find nearest active spiked hazard box
    let targetBox: Phaser.GameObjects.Image | null = null;
    let minDist = 999999;
    if (this.hazardBoxesGroup) {
      const boxes = this.hazardBoxesGroup.getChildren() as Phaser.GameObjects.Image[];
      for (const b of boxes) {
        if (!b.active) continue;
        const dist = Phaser.Math.Distance.Between(x, y, b.x, b.y);
        if (dist < minDist) {
          minDist = dist;
          targetBox = b;
        }
      }
    }

    const speed = 360;
    if (targetBox) {
      const angle = Phaser.Math.Angle.Between(x, y, targetBox.x, targetBox.y);
      defBullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    } else {
      const dir = this.player.flipX ? -1 : 1;
      defBullet.setVelocity(dir * speed, 0);
    }

    this.tweens.add({
      targets: defBullet,
      angle: 360,
      duration: 600,
      repeat: -1
    });

    this.time.delayedCall(4000, () => {
      if (defBullet.active && !defBullet.getData('destroyed')) {
        this.dissolveBullet(defBullet, false);
      }
    });
  }

  protected handleDeflectedBulletImpact(bullet: Phaser.GameObjects.Image, box: Phaser.GameObjects.Image) {
    if (!bullet.active || bullet.getData('destroyed') || !box.active) return;
    bullet.setData('destroyed', true);
    this.dissolveBullet(bullet, true);

    // Spiked boxes are immune to deflected bullets (can ONLY be destroyed by skill attacks)
    sound.playShieldBlock();
    box.setTint(0x94a3b8);
    this.tweens.add({
      targets: box,
      x: box.x + Phaser.Math.Between(-3, 3),
      duration: 40,
      yoyo: true,
      repeat: 1,
      onComplete: () => box.clearTint()
    });
  }

  protected collectShieldPickup(pickup: Phaser.GameObjects.GameObject) {
    const p = pickup as Phaser.GameObjects.Image;
    if (!p.active) return;
    p.destroy();

    gameMaster.addShield(50);
    sound.playShieldPickup();

    this.showBoxHitText(this.player.x, this.player.y - 45, '+50 SHIELD');

    // Golden & cyan aura burst around the hero
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const spark = this.add.circle(
        this.player.x + Math.cos(angle) * 26,
        this.player.y + Math.sin(angle) * 32,
        Phaser.Math.Between(2, 4),
        0x38bdf8,
        0.9
      );
      spark.setDepth(20);
      this.tweens.add({
        targets: spark,
        x: spark.x + Math.cos(angle) * 38,
        y: spark.y + Math.sin(angle) * 38,
        scale: 0,
        alpha: 0,
        duration: 400,
        onComplete: () => spark.destroy()
      });
    }
  }

  protected showBoxHitText(x: number, y: number, text: string) {
    const t = this.add.text(x, y, text, {
      fontFamily: 'Cinzel, serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#fef08a',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(25);

    this.tweens.add({
      targets: t,
      y: y - 24,
      alpha: { from: 1, to: 0 },
      duration: 600,
      onComplete: () => t.destroy()
    });
  }

  protected handleHazardContact(hazardBox: Phaser.GameObjects.GameObject) {
    if (this.isInvulnerable || this.isTransitioning) return;

    gameMaster.damagePlayer(15);

    // Recoil knockback away from hazard box
    const box = hazardBox as Phaser.GameObjects.Image;
    const recoilDir = this.player.x < box.x ? -1 : 1;
    this.triggerHeroHurt(recoilDir * 230, -260, 380);
  }

  protected handlePitFall() {
    this.isInvulnerable = true;
    sound.playHit();
    gameMaster.damagePlayer(25);
    this.cameras.main.shake(180, 0.012);

    this.player.setVelocity(0, 0);
    this.player.setPosition(this.lastCheckpointX, this.lastCheckpointY);

    this.tweens.add({
      targets: this.player,
      alpha: { from: 0.3, to: 1 },
      duration: 150,
      repeat: 4,
      onComplete: () => {
        this.player.setAlpha(1);
        this.isInvulnerable = false;
      }
    });
  }

  protected onPlayerDied() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    sound.playHit();
    this.cameras.main.shake(300, 0.02);
    this.player.anims.play('hero_hurt', true);
    this.player.setTint(0xff0000);
    this.player.setVelocity(0, 0);

    this.cameras.main.fade(800, 0, 0, 0, false, (_cam: any, progress: number) => {
      if (progress === 1) {
        gameMaster.healPlayer(100);
        this.scene.restart();
      }
    });
  }

  protected checkExitGate() {
    const exitX = this.config.worldWidth - 140;

    if (Math.abs(this.player.x - exitX) < 40 && Math.abs(this.player.y - 580) < 80) {
      if (!this.isTransitioning && this.config.nextSceneKey) {
        this.isTransitioning = true;
        sound.playMagicChime();
        this.cameras.main.fade(600, 0, 0, 0, false, (_cam: any, progress: number) => {
          if (progress === 1) {
            this.scene.start(this.config.nextSceneKey);
          }
        });
      }
    }
  }

  protected updateSlimes() {
    if (!this.slimesGroup) return;

    const now = this.time.now;
    const slimes = this.slimesGroup.getChildren() as Phaser.Physics.Arcade.Sprite[];
    for (const slime of slimes) {
      if (!slime.active || slime.getData('defeated')) continue;

      // Track floating mini HP bar above slime
      const hpBar = slime.getData('hpBarContainer') as Phaser.GameObjects.Container | undefined;
      if (hpBar && hpBar.active) {
        hpBar.x = slime.x;
        hpBar.y = slime.y - 28;
      }

      const body = slime.body as Phaser.Physics.Arcade.Body;
      const isCorrupted = !!slime.getData('isCorrupted');
      const startX = slime.getData('startX') || slime.x;
      const patrolRange = slime.getData('patrolRange') || 80;
      const patrolSpeed = slime.getData('patrolSpeed') || 45;
      const aggroSpeed = slime.getData('speed') || (isCorrupted ? 140 : 65);
      const aggroRange = slime.getData('aggroRange') || (isCorrupted ? 320 : 180);

      const distToPlayer = Phaser.Math.Distance.Between(slime.x, slime.y, this.player.x, this.player.y);
      const dy = Math.abs(this.player.y - slime.y);
      const isPlayerNear = distToPlayer < aggroRange && dy < 170;

      // Aggressive Corrupted Slime emits dark purple void particles
      if (isCorrupted && Math.random() < 0.22) {
        const vp = this.add.circle(
          slime.x + Phaser.Math.Between(-10, 10),
          slime.y + Phaser.Math.Between(-8, 8),
          Phaser.Math.Between(2, 4),
          0xc026d3,
          0.75
        );
        vp.setDepth(17);
        this.tweens.add({
          targets: vp,
          y: vp.y - 18,
          alpha: 0,
          scale: 0,
          duration: 350,
          onComplete: () => vp.destroy()
        });
      }

      if (isPlayerNear) {
        // --- Aggressive Combat Trigger ---
        const wasAggroed = slime.getData('isAggroed');
        if (!wasAggroed) {
          slime.setData('isAggroed', true);
          sound.playSlimeSquish();

          // Combat exclamation alert
          const alert = this.add.text(slime.x, slime.y - 32, '!', {
            fontFamily: 'sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
            color: isCorrupted ? '#ff0055' : '#fde047'
          }).setOrigin(0.5).setDepth(20);

          this.tweens.add({
            targets: alert,
            y: alert.y - 16,
            alpha: 0,
            duration: 500,
            onComplete: () => alert.destroy()
          });
        }

        const chaseDir = this.player.x < slime.x ? -1 : 1;
        slime.setData('dir', chaseDir);
        slime.setFlipX(chaseDir < 0);

        if (isCorrupted) {
          // Aggressive Corrupted Slime: high-speed sprint + leaping pounce!
          const lastPounce = slime.getData('lastPounceTime') || 0;
          const isGrounded = body.blocked.down || body.touching.down;

          if (isGrounded && distToPlayer < 240 && now - lastPounce > 1600) {
            slime.setData('lastPounceTime', now);
            body.setVelocity(chaseDir * 180, -260);
            slime.setTint(0xff0055);
            this.time.delayedCall(280, () => {
              if (slime.active && !slime.getData('defeated')) {
                slime.setTint(0xc026d3);
              }
            });
          } else if (isGrounded) {
            body.setVelocityX(chaseDir * aggroSpeed);
          }
        } else {
          // Normal slime advances toward player
          body.setVelocityX(chaseDir * aggroSpeed);
        }
      } else {
        // --- Peaceful Patrol Mode ---
        slime.setData('isAggroed', false);
        let dir = slime.getData('dir') || 1;

        if (slime.x >= startX + patrolRange) {
          dir = -1;
          slime.setData('dir', dir);
          slime.setFlipX(true);
        } else if (slime.x <= startX - patrolRange) {
          dir = 1;
          slime.setData('dir', dir);
          slime.setFlipX(false);
        }

        body.setVelocityX(dir * patrolSpeed);
      }
    }
  }

  protected hitSlimeWithNormalAttack(slime: Phaser.Physics.Arcade.Sprite, damage: number = ActBaseScene.DAMAGE_COMBO_1) {
    if (!slime.active || slime.getData('defeated')) return;

    const now = this.time.now;
    const lastHit = slime.getData('lastHitTime') || 0;
    if (now - lastHit < 180) return;
    slime.setData('lastHitTime', now);

    const isCorrupted = !!slime.getData('isCorrupted');
    const defaultHp = isCorrupted ? ActBaseScene.HP_CORRUPTED_SLIME : ActBaseScene.HP_NORMAL_SLIME;
    const currentHp = (this.entityHp.get(slime) ?? defaultHp) - damage;
    this.entityHp.set(slime, currentHp);

    if (currentHp <= 0) {
      this.entityHp.delete(slime);
      this.defeatSlime(slime, false);
    } else {
      sound.playSlimeSquish();
      slime.setTint(0xffffff);

      const knockDir = slime.x < this.player.x ? -1 : 1;
      slime.setVelocity(knockDir * (isCorrupted ? 150 : 130), -130);

      this.tweens.add({
        targets: slime,
        scaleY: 0.7,
        scaleX: 1.3,
        duration: 60,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          if (slime.active) {
            slime.clearTint();
            if (isCorrupted) {
              slime.setTint(0xc026d3);
            }
          }
        }
      });

      this.cameras.main.shake(60, 0.004);
      this.spawnSlimeGoo(slime.x, slime.y, 4, isCorrupted);
      this.updateSlimeHpBar(slime, currentHp, defaultHp, isCorrupted);
    }
  }

  protected hitSlimeWithSkill(slime: Phaser.Physics.Arcade.Sprite, damage: number = ActBaseScene.DAMAGE_SKILL) {
    if (!slime.active || slime.getData('defeated')) return;

    const isCorrupted = !!slime.getData('isCorrupted');
    const defaultHp = isCorrupted ? ActBaseScene.HP_CORRUPTED_SLIME : ActBaseScene.HP_NORMAL_SLIME;
    const currentHp = (this.entityHp.get(slime) ?? defaultHp) - damage;
    this.entityHp.set(slime, currentHp);

    if (currentHp <= 0) {
      this.entityHp.delete(slime);
      this.defeatSlime(slime, true);
    } else {
      sound.playHit();
      sound.playSlimeSquish();
      slime.setTint(0xfde047); // Golden radiant flash on skill impact

      const knockDir = slime.x < this.player.x ? -1 : 1;
      slime.setVelocity(knockDir * 220, -180);

      this.tweens.add({
        targets: slime,
        scaleY: 0.6,
        scaleX: 1.4,
        duration: 80,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          if (slime.active) {
            slime.clearTint();
            if (isCorrupted) {
              slime.setTint(0xc026d3);
            }
          }
        }
      });

      this.cameras.main.shake(100, 0.008);
      this.spawnSlimeGoo(slime.x, slime.y, 7, isCorrupted);
      this.updateSlimeHpBar(slime, currentHp, defaultHp, isCorrupted);
    }
  }

  protected updateSlimeHpBar(slime: Phaser.Physics.Arcade.Sprite, currentHp: number, maxHp: number, isCorrupted: boolean) {
    let barContainer = slime.getData('hpBarContainer') as Phaser.GameObjects.Container | undefined;
    const barWidth = 44;
    const barHeight = 5;

    if (!barContainer || !barContainer.active) {
      barContainer = this.add.container(slime.x, slime.y - 28);
      barContainer.setDepth(22);

      const bg = this.add.rectangle(0, 0, barWidth + 2, barHeight + 2, 0x0f172a, 0.95);
      bg.setStrokeStyle(1, isCorrupted ? 0xc026d3 : 0x22c55e);

      const fill = this.add.rectangle(-barWidth / 2, 0, barWidth, barHeight, isCorrupted ? 0xd946ef : 0x22c55e, 1);
      fill.setOrigin(0, 0.5);

      barContainer.add([bg, fill]);
      barContainer.setData('fill', fill);
      slime.setData('hpBarContainer', barContainer);
    }

    const fill = barContainer.getData('fill') as Phaser.GameObjects.Rectangle;
    if (fill) {
      const pct = Math.max(0, Math.min(1, currentHp / maxHp));
      this.tweens.add({
        targets: fill,
        width: pct * barWidth,
        duration: 140,
        ease: 'Quad.easeOut'
      });
    }

    barContainer.x = slime.x;
    barContainer.y = slime.y - 28;
  }

  protected defeatSlime(slime: Phaser.Physics.Arcade.Sprite, bySkill: boolean = false) {
    if (!slime.active || slime.getData('defeated')) return;
    slime.setData('defeated', true);
    this.entityHp.delete(slime);

    const isCorrupted = !!slime.getData('isCorrupted');

    // Clean up mini health bar
    const hpBar = slime.getData('hpBarContainer') as Phaser.GameObjects.Container | undefined;
    if (hpBar && hpBar.active) hpBar.destroy();

    sound.playSlimeSquish();
    sound.playHit();
    this.cameras.main.shake(bySkill ? 100 : 70, bySkill ? 0.007 : 0.005);

    const sx = slime.x;
    const sy = slime.y;
    slime.destroy();

    this.spawnSlimeGoo(sx, sy, bySkill ? 16 : 10, isCorrupted);

    // Cheer Mascot companion on monster defeat!
    if (this.mascotCompanion && this.mascotCompanion.active) {
      this.tweens.add({
        targets: this.mascotCompanion,
        y: this.mascotCompanion.y - 18,
        duration: 140,
        yoyo: true,
        repeat: 1,
        ease: 'Quad.easeOut'
      });
    }

    // Drop bonus coins (90% for corrupted slime with 2 coins, 70% for normal slime with 1 coin)
    const coinChance = isCorrupted ? 0.9 : 0.7;
    if (Math.random() < coinChance) {
      const bonusCoin = this.coinsGroup.create(sx, sy - 12, 'coin') as Phaser.Physics.Arcade.Image;
      bonusCoin.setDisplaySize(24, 24);
      (bonusCoin.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      bonusCoin.setDepth(6);
      sound.playCoin();

      if (isCorrupted) {
        const bonusCoin2 = this.coinsGroup.create(sx + 18, sy - 12, 'coin') as Phaser.Physics.Arcade.Image;
        bonusCoin2.setDisplaySize(24, 24);
        (bonusCoin2.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        bonusCoin2.setDepth(6);
      }
    }
  }

  protected spawnSlimeGoo(x: number, y: number, count: number, isCorrupted: boolean = false) {
    const normalColors = [0x4ade80, 0x22c55e, 0x86efac];
    const corruptedColors = [0xc026d3, 0x8b5cf6, 0x4c1d95, 0xec4899];
    const palette = isCorrupted ? corruptedColors : normalColors;

    for (let i = 0; i < count; i++) {
      const color = palette[i % palette.length];
      const goo = this.add.circle(
        x + Phaser.Math.Between(-12, 12),
        y + Phaser.Math.Between(-10, 10),
        Phaser.Math.Between(3, 6),
        color,
        0.85
      );
      goo.setDepth(18);

      const vx = Phaser.Math.Between(-130, 130);
      this.tweens.add({
        targets: goo,
        x: goo.x + vx * 0.45,
        y: goo.y + 110,
        scale: 0,
        alpha: 0,
        duration: 350 + Phaser.Math.Between(0, 150),
        onComplete: () => goo.destroy()
      });
    }
  }

  protected handlePlayerSlimeContact(slime: Phaser.Physics.Arcade.Sprite) {
    if (!slime.active || slime.getData('defeated') || this.isInvulnerable || this.isTransitioning) return;

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    const isStomp = (playerBody.velocity.y > 0 && this.player.y < slime.y - 8) ||
                    (playerBody.bottom < slime.y + 12 && playerBody.velocity.y >= -30);

    // Feature: Jumping on top of slime kills it and bounces hero upward!
    if (isStomp) {
      const sx = slime.x;
      const sy = slime.y;
      this.defeatSlime(slime, false);

      // Upward bounce recoil
      this.player.setVelocityY(-400);
      sound.playJump();
      this.player.anims.play('hero_jump', true);
      this.cameras.main.shake(90, 0.006);
      this.showBoxHitText(sx, sy - 20, 'STOMP!');
      return;
    }

    const isCorrupted = !!slime.getData('isCorrupted');
    const contactDamage = slime.getData('contactDamage') || (isCorrupted ? 16 : 10);

    if (this.isGuarding) {
      sound.playShieldBlock();
      this.cameras.main.shake(isCorrupted ? 90 : 60, 0.005);
      const repulseDir = this.player.x < slime.x ? 1 : -1;
      slime.setVelocity(repulseDir * (isCorrupted ? 220 : 180), -140);
      return;
    }

    gameMaster.damagePlayer(contactDamage);
    const recoilDir = this.player.x < slime.x ? -1 : 1;
    slime.setVelocity(-recoilDir * 110, -90);
    this.triggerHeroHurt(recoilDir * 190, -230, 380);
  }

  // --- Mascot Companion Follower Implementation ---
  protected setupMascotCompanion() {
    const actKey = this.config.actKey;
    if (actKey === 'ACT_V') return; // In Act V, Mascot is the transformed boss!

    const isRescued = gameMaster.isMilestoneCompleted('mascot_rescued') || (actKey !== 'ACT_I' && actKey !== 'PROLOGUE');
    if (isRescued && this.player) {
      this.spawnMascotCompanion(this.player.x - 42, this.player.y - 48);
    }
  }

  protected spawnMascotCompanion(spawnX: number, spawnY: number) {
    if (this.mascotCompanion && this.mascotCompanion.active) return;

    this.mascotCompanion = this.add.sprite(spawnX, spawnY, 'mascot');
    this.mascotCompanion.setDisplaySize(56, 56);
    this.mascotCompanion.setDepth(13);

    if (!this.anims.exists('mascot_fly')) {
      this.anims.create({
        key: 'mascot_fly',
        frames: [
          { key: 'mascot', frame: 0 },
          { key: 'mascot', frame: 1 },
          { key: 'mascot', frame: 2 },
          { key: 'mascot', frame: 1 }
        ],
        frameRate: 8,
        repeat: -1
      });
    }
    this.mascotCompanion.play('mascot_fly');

    // Initial summon burst
    sound.playMagicChime();
    for (let i = 0; i < 14; i++) {
      const spark = this.add.circle(
        spawnX + Phaser.Math.Between(-16, 16),
        spawnY + Phaser.Math.Between(-16, 16),
        Phaser.Math.Between(2, 5),
        i % 2 === 0 ? 0x38bdf8 : 0xfde047,
        0.9
      );
      spark.setDepth(15);
      this.tweens.add({
        targets: spark,
        y: spark.y - Phaser.Math.Between(15, 38),
        x: spark.x + Phaser.Math.Between(-15, 15),
        alpha: 0,
        scale: 0,
        duration: 450 + Phaser.Math.Between(0, 300),
        onComplete: () => spark.destroy()
      });
    }
  }

  protected updateMascotCompanion() {
    if (!this.mascotCompanion || !this.mascotCompanion.active || !this.player) return;

    if (!this.mascotCompanion.anims.isPlaying) {
      this.mascotCompanion.play('mascot_fly', true);
    }

    const now = this.time.now;
    const isFacingLeft = this.player.flipX;
    const followOffsetX = isFacingLeft ? 42 : -42;
    const bobbing = Math.sin(now * 0.005) * 6;

    const targetX = this.player.x + followOffsetX;
    const targetY = this.player.y - 48 + bobbing;

    // Smooth floating follow
    this.mascotCompanion.x = Phaser.Math.Linear(this.mascotCompanion.x, targetX, 0.08);
    this.mascotCompanion.y = Phaser.Math.Linear(this.mascotCompanion.y, targetY, 0.08);
    this.mascotCompanion.setFlipX(isFacingLeft);
    this.mascotCompanion.setAngle(Phaser.Math.Clamp((targetX - this.mascotCompanion.x) * 0.35, -18, 18));

    // Leaving flowers / blossom motes in its trail ("Did you just do that? A small flower bloomed beneath your feet.")
    const isHeroMoving = Math.abs((this.player.body as Phaser.Physics.Arcade.Body)?.velocity.x || 0) > 15;
    if (isHeroMoving && now - this.lastMascotTrailTime > 450) {
      this.lastMascotTrailTime = now;
      this.spawnMascotBlossomMote(this.mascotCompanion.x, this.mascotCompanion.y + 16);
    }
  }

  protected spawnMascotBlossomMote(x: number, y: number) {
    const colors = [0xf472b6, 0xfde047, 0x4ade80, 0x67e8f9];
    const color = colors[Phaser.Math.Between(0, colors.length - 1)];
    const mote = this.add.circle(
      x + Phaser.Math.Between(-6, 6),
      y + Phaser.Math.Between(-4, 4),
      Phaser.Math.Between(2, 4),
      color,
      0.85
    );
    mote.setDepth(11);

    this.tweens.add({
      targets: mote,
      y: mote.y + Phaser.Math.Between(12, 28),
      x: mote.x + (this.player.flipX ? 15 : -15),
      scale: 0.2,
      alpha: 0,
      duration: 650,
      ease: 'Sine.easeOut',
      onComplete: () => mote.destroy()
    });
  }

  protected checkNPCProximity() {
    if (this.isTransitioning) {
      this.hideInteractionPrompt();
      return;
    }

    let closestNPC: Phaser.Physics.Arcade.Sprite | null = null;
    let closestPoint: Phaser.Physics.Arcade.Sprite | null = null;
    let minDist = 95; // 95px proximity interaction radius

    if (this.npcsGroup) {
      const npcs = this.npcsGroup.getChildren() as Phaser.Physics.Arcade.Sprite[];
      for (const npc of npcs) {
        if (!npc.active) continue;
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
        if (d < minDist) {
          minDist = d;
          closestNPC = npc;
          closestPoint = null;
        }
      }
    }

    if (this.interactionPointsGroup) {
      const points = this.interactionPointsGroup.getChildren() as Phaser.Physics.Arcade.Sprite[];
      for (const point of points) {
        if (!point.active) continue;
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, point.x, point.y);
        if (d < minDist) {
          minDist = d;
          closestPoint = point;
          closestNPC = null;
        }
      }
    }

    if (closestNPC) {
      this.nearbyNPC = closestNPC;
      this.nearbyPoint = null;
      if (!dialogue.isActive) {
        this.showInteractionPrompt(`Talk to ${closestNPC.getData('name')}`);
      }
    } else if (closestPoint) {
      this.nearbyPoint = closestPoint;
      this.nearbyNPC = null;
      if (!dialogue.isActive) {
        this.showInteractionPrompt(closestPoint.getData('promptText') || `Inspect ${closestPoint.getData('title')}`);
      }
    } else {
      this.nearbyNPC = null;
      this.nearbyPoint = null;
      this.hideInteractionPrompt();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.E) && !dialogue.isActive) {
      if (this.nearbyNPC) {
        this.interactWithNPC(this.nearbyNPC);
      } else if (this.nearbyPoint) {
        this.interactWithPoint(this.nearbyPoint);
      }
    }
  }

  protected interactWithNPC(npc: Phaser.Physics.Arcade.Sprite) {
    const lines = npc.getData('lines') as { speaker: string; text: string }[];
    const portrait = npc.getData('portrait') as string | undefined;
    if (!lines || lines.length === 0) return;

    const formattedLines = lines.map(l => ({
      speaker: l.speaker,
      portrait: portrait,
      text: l.text
    }));

    const idleFrame = npc.getData('idleFrame') ?? 1;
    const talkFrame = npc.getData('talkFrame') ?? 0;
    npc.setFrame(talkFrame);

    this.hideInteractionPrompt();
    sound.playMagicChime();
    dialogue.playCutscene(formattedLines, () => {
      npc.setFrame(idleFrame);
      this.checkNPCProximity();
    });
  }

  protected interactWithPoint(point: Phaser.Physics.Arcade.Sprite) {
    const lines = point.getData('lines') as { speaker: string; text: string }[];
    const milestoneId = point.getData('milestoneId') as string | undefined;
    const title = point.getData('title') as string | undefined;

    if (milestoneId) {
      gameMaster.completeMilestone(milestoneId);
    }

    // Special logic for Memory Anchors in Act V
    if (title?.includes('First Anchor')) {
      gameMaster.activeAnchors[0] = true;
      gameMaster.updateDOMHUD();
    } else if (title?.includes('Second Anchor')) {
      gameMaster.activeAnchors[1] = true;
      gameMaster.updateDOMHUD();
    } else if (title?.includes('Third Anchor')) {
      gameMaster.activeAnchors[2] = true;
      gameMaster.completeMilestone('anchors_cleared');
      gameMaster.updateDOMHUD();
    }

    if (!lines || lines.length === 0) return;

    // Special logic for The Machine of Kings in Act IV (40 coins required)
    if (title === 'The Machine of Kings') {
      const formattedLines: DialogueLine[] = lines.map(l => ({
        speaker: l.speaker,
        text: l.text
      }));

      if (gameMaster.coins >= 40) {
        formattedLines.push({
          speaker: 'Mechanism',
          text: `You currently possess ${gameMaster.coins} gold coins. Insert 40 coins to forge the Golden Castle Key?`,
          choices: [
            {
              text: 'Insert 40 Coins to Forge Key',
              onSelect: () => {
                gameMaster.spendCoins(40);
                gameMaster.goldenKeyUnlocked = true;
                gameMaster.completeMilestone('gate_machine_unlocked');
                sound.playMagicChime();
              }
            },
            {
              text: 'Keep Coins for Now',
              onSelect: () => {}
            }
          ] as any
        });
      } else {
        formattedLines.push({
          speaker: 'Mechanism',
          text: `Insufficient gold: holding ${gameMaster.coins} / 40 coins required. Explore the ramparts to gather more!`
        });
      }

      this.hideInteractionPrompt();
      sound.playMagicChime();
      dialogue.playCutscene(formattedLines, () => {
        this.checkNPCProximity();
      });
      return;
    }

    const formattedLines = lines.map(l => ({
      speaker: l.speaker,
      text: l.text
    }));

    this.hideInteractionPrompt();
    sound.playMagicChime();
    dialogue.playCutscene(formattedLines, () => {
      if (milestoneId === 'mascot_rescued') {
        const beacon = point.getData('beacon') as Phaser.GameObjects.GameObject | undefined;
        if (beacon && (beacon as any).active) beacon.destroy();
        this.spawnMascotCompanion(point.x, point.y - 30);
        point.destroy();
      }
      this.checkNPCProximity();
    });
  }

  protected showInteractionPrompt(text: string) {
    const promptEl = document.getElementById('interaction-prompt');
    const textEl = document.getElementById('interaction-text');
    if (promptEl && textEl) {
      textEl.textContent = text;
      promptEl.classList.remove('hidden');
    }
  }

  protected hideInteractionPrompt() {
    const promptEl = document.getElementById('interaction-prompt');
    if (promptEl) {
      promptEl.classList.add('hidden');
    }
  }

  // --- Boss Battle Mechanics & AI ---

  protected buildBoss() {
    if (!this.config.boss) return;
    const b = this.config.boss;
    this.bossMaxHp = b.maxHp;
    this.bossHp = b.maxHp;
    this.isBossActive = false;
    this.isBossDefeated = false;

    this.bossHudEl = document.getElementById('boss-hud');
    this.bossBarFillEl = document.getElementById('boss-bar-fill');
    this.bossNameEl = document.getElementById('boss-name');
    this.bossPhaseTextEl = document.getElementById('boss-phase-text');

    const enemyOffsetY = this.config.enemyOffsetY ?? 12;

    // In Zone 4 Colosseum arena, floor surface is at y = 540
    const floorY = (b.y || 540) + enemyOffsetY;
    this.bossSprite = this.physics.add.sprite(b.x, floorY, b.key);
    this.bossSprite.setOrigin(0.5, 1.0); // Base sits flush on top of the arena floor!
    this.bossSprite.setDisplaySize(180, 180);
    this.bossSprite.setSize(120, 164);
    this.bossSprite.setOffset(36, 26);
    this.bossSprite.setDepth(9);

    // Register Boss Idle and Attack Animations
    const idleAnimKey = `${b.key}_idle_anim`;
    if (!this.anims.exists(idleAnimKey)) {
      const tex = this.textures.get(b.key);
      const frameTotal = tex ? tex.frameTotal - 1 : 1;
      if (frameTotal > 1) {
        this.anims.create({
          key: idleAnimKey,
          frames: this.anims.generateFrameNumbers(b.key, { start: 0, end: frameTotal - 1 }),
          frameRate: 4,
          repeat: -1
        });
      }
    }
    if (this.anims.exists(idleAnimKey)) {
      this.bossSprite.play(idleAnimKey);
    }

    const attackAnimKey = `${b.key}_attack_anim`;
    if (!this.anims.exists(attackAnimKey) && this.textures.exists(`${b.key}_attack`)) {
      this.anims.create({
        key: attackAnimKey,
        frames: this.anims.generateFrameNumbers(`${b.key}_attack`, { start: 0, end: 2 }),
        frameRate: 6,
        repeat: 0
      });
    }

    const body = this.bossSprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.setImmovable(false); // MUST be false so static ground collider separates and holds boss on floor!
    body.setCollideWorldBounds(true);

    this.physics.add.collider(this.bossSprite, this.groundGroup);
    this.physics.add.collider(this.bossSprite, this.platformsGroup);

    if (this.player && this.bossSprite) {
      this.physics.add.overlap(this.player, this.bossSprite, () => {
        this.handlePlayerBossContact();
      });
    }

    // Create the floating in-game health bar directly overhead
    this.createBossOverheadHealthBar();

    this.tweens.add({
      targets: this.bossSprite,
      scaleY: { from: 1, to: 0.94 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  protected updateBoss() {
    if (!this.bossSprite || !this.bossSprite.active || this.isBossDefeated || !this.config.boss) return;

    // Safety clamp: keep boss firmly standing on the colosseum floor surface
    const enemyOffsetY = this.config.enemyOffsetY ?? 12;
    const bossFloorY = (this.config.boss.y || 540) + enemyOffsetY;
    if (this.bossSprite.y > bossFloorY) {
      this.bossSprite.y = bossFloorY;
      this.bossSprite.setVelocityY(0);
    }

    // Keep floating overhead health bar directly above boss
    if (this.bossOverheadContainer && this.bossOverheadContainer.active) {
      this.bossOverheadContainer.x = this.bossSprite.x;
      this.bossOverheadContainer.y = this.bossSprite.y - 190;
    }

    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.bossSprite.x, this.bossSprite.y);

    // Awaken boss upon entering arena within 750px
    if (!this.isBossActive && dist < 750) {
      this.isBossActive = true;
      sound.playBossRoar();
      this.cameras.main.shake(300, 0.012);

      if (this.bossHudEl) {
        this.bossHudEl.classList.remove('hidden');
      }
      if (this.bossNameEl) {
        this.bossNameEl.textContent = this.config.boss.name;
      }
      if (this.bossPhaseTextEl) {
        this.bossPhaseTextEl.textContent = this.config.boss.title;
      }
      this.updateBossHpBar();

      // Smoothly fade in the floating overhead health bar
      if (this.bossOverheadContainer) {
        this.tweens.add({
          targets: this.bossOverheadContainer,
          alpha: 1,
          duration: 400
        });
      }

      const interval = this.config.boss.attackInterval || 3000;
      this.bossAttackTimer = this.time.addEvent({
        delay: interval,
        loop: true,
        callback: this.triggerBossAttack,
        callbackScope: this
      });
    }

    if (this.isBossActive) {
      // Boss turns to confront player
      this.bossSprite.setFlipX(this.player.x > this.bossSprite.x);

      // Steady arena advance
      const dir = this.player.x < this.bossSprite.x ? -1 : 1;
      if (dist > 130) {
        this.bossSprite.setVelocityX(dir * 55);
      } else {
        this.bossSprite.setVelocityX(0);
      }
    }
  }

  protected createBossOverheadHealthBar() {
    if (!this.bossSprite || !this.config.boss) return;

    const b = this.config.boss;
    const barWidth = 170;
    const barHeight = 14;

    this.bossOverheadContainer = this.add.container(this.bossSprite.x, this.bossSprite.y - 190);
    this.bossOverheadContainer.setDepth(26);
    this.bossOverheadContainer.setAlpha(0); // Fades in on boss awaken

    // 1. Shadow / Outer Border
    const shadow = this.add.rectangle(0, 0, barWidth + 6, barHeight + 6, 0x0f172a, 0.95);
    shadow.setStrokeStyle(2, 0xf59e0b, 1);

    // 2. Background Track
    this.bossOverheadBg = this.add.rectangle(0, 0, barWidth, barHeight, 0x1e293b, 1);

    // 3. Delayed Damage Lag Bar (Yellow/White)
    this.bossOverheadDamageBar = this.add.rectangle(-barWidth / 2, 0, barWidth, barHeight, 0xfde047, 0.9);
    this.bossOverheadDamageBar.setOrigin(0, 0.5);

    // 4. Current HP Fill Bar (Crimson / Vibrant Red)
    this.bossOverheadFill = this.add.rectangle(-barWidth / 2, 0, barWidth, barHeight, 0xef4444, 1);
    this.bossOverheadFill.setOrigin(0, 0.5);

    // 5. Boss Name Label overhead
    this.bossOverheadName = this.add.text(0, -18, `${b.name} [BOSS]`, {
      fontFamily: 'Cinzel, serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#fef08a'
    }).setOrigin(0.5);
    this.bossOverheadName.setStroke('#000000', 3);

    // 6. Numeric HP Label
    this.bossOverheadText = this.add.text(0, 0, `${this.bossHp} / ${this.bossMaxHp} HP`, {
      fontFamily: 'sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.bossOverheadText.setStroke('#000000', 3);

    this.bossOverheadContainer.add([
      shadow,
      this.bossOverheadBg,
      this.bossOverheadDamageBar,
      this.bossOverheadFill,
      this.bossOverheadName,
      this.bossOverheadText
    ]);
  }

  protected triggerBossAttack() {
    if (!this.bossSprite || !this.bossSprite.active || this.isBossDefeated || this.isTransitioning) return;

    const bKey = this.config.boss?.key;
    const attackAnim = `${bKey}_attack_anim`;
    if (this.anims.exists(attackAnim)) {
      this.bossSprite.play(attackAnim);
    }

    // Telegraph charge with danger tint & roar
    this.bossSprite.setTint(0xff3366);
    sound.playBossRoar();

    this.time.delayedCall(380, () => {
      if (!this.bossSprite || !this.bossSprite.active || this.isBossDefeated) return;
      this.bossSprite.clearTint();

      const idleAnim = `${bKey}_idle_anim`;
      if (this.anims.exists(idleAnim)) {
        this.bossSprite.play(idleAnim);
      } else if (bKey) {
        this.bossSprite.setTexture(bKey);
      }

      const bx = this.bossSprite.x;
      const by = this.bossSprite.y;
      const dir = this.player.x < bx ? -1 : 1;

      // Hurl dark boss projectile into the arena
      const bulletKey = this.config.hazardBulletKey || 'void_bullet';
      const proj = this.hazardBulletsGroup.create(bx + dir * 65, by - 65, bulletKey) as Phaser.Physics.Arcade.Image;
      if (proj) {
        proj.setDisplaySize(32, 32);
        (proj.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        proj.setVelocity(dir * 180, 0);
        proj.setDepth(15);
      }

      this.cameras.main.shake(120, 0.007);
    });
  }

  protected damageBoss(damage: number, isSkill: boolean = false) {
    if (!this.bossSprite || !this.bossSprite.active || this.isBossDefeated) return;

    this.bossHp = Math.max(0, this.bossHp - damage);
    this.updateBossHpBar();

    const bKey = this.config.boss?.key;
    if (bKey && this.textures.exists(`${bKey}_flinch`)) {
      this.bossSprite.setTexture(`${bKey}_flinch`);
    }

    sound.playHit();
    this.bossSprite.setTint(isSkill ? 0xfde047 : 0xff4444);
    this.tweens.add({
      targets: this.bossSprite,
      x: this.bossSprite.x + (this.player.x < this.bossSprite.x ? 6 : -6),
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        if (this.bossSprite && this.bossSprite.active) {
          this.bossSprite.clearTint();
          if (!this.isBossDefeated) {
            const idleAnim = `${bKey}_idle_anim`;
            if (this.anims.exists(idleAnim)) {
              this.bossSprite.play(idleAnim);
            } else if (bKey) {
              this.bossSprite.setTexture(bKey);
            }
          }
        }
      }
    });

    if (this.bossHp <= 0) {
      this.defeatBoss();
    }
  }

  protected updateBossHpBar() {
    const pct = Math.max(0, Math.min(100, (this.bossHp / this.bossMaxHp) * 100));

    // Update DOM HUD bar if present
    if (this.bossBarFillEl) {
      this.bossBarFillEl.style.width = `${pct}%`;
      if (pct < 35 && this.bossPhaseTextEl) {
        this.bossPhaseTextEl.textContent = 'Enraged Phase!';
        this.bossBarFillEl.style.background = 'linear-gradient(90deg, #dc2626, #ef4444)';
      }
    }

    // Update In-Game Floating Overhead Health Bar
    if (this.bossOverheadFill && this.bossOverheadText && this.bossOverheadDamageBar) {
      const barWidth = 170;
      const targetWidth = (pct / 100) * barWidth;
      this.bossOverheadFill.width = targetWidth;

      if (pct < 35) {
        this.bossOverheadFill.setFillStyle(0xdc2626); // Enraged crimson
      }

      this.tweens.add({
        targets: this.bossOverheadDamageBar,
        width: targetWidth,
        duration: 350,
        ease: 'Quad.easeOut'
      });

      this.bossOverheadText.setText(`${Math.max(0, this.bossHp)} / ${this.bossMaxHp} HP`);
    }
  }

  protected defeatBoss() {
    if (!this.bossSprite || this.isBossDefeated) return;
    this.isBossDefeated = true;
    this.isBossActive = false;
    if (this.bossAttackTimer) this.bossAttackTimer.destroy();

    // Fade out and clean up floating overhead health bar
    if (this.bossOverheadContainer && this.bossOverheadContainer.active) {
      this.tweens.add({
        targets: this.bossOverheadContainer,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.bossOverheadContainer?.destroy();
          this.bossOverheadContainer = null;
        }
      });
    }

    // Act IV Climax: Scene 4 — The King's Defeat & Crown Fracture
    if (this.config.actKey === 'ACT_IV') {
      if (this.bossHudEl) {
        this.bossHudEl.classList.add('hidden');
      }
      this.player.setVelocity(0, 0);
      sound.playBossDefeat();
      this.cameras.main.shake(600, 0.02);
      this.bossSprite.setTint(0xc084fc);

      const act4Cutscene = [
        { speaker: 'Hero', text: "It's over." },
        { speaker: 'King Aurel', text: "No." },
        { speaker: 'King Aurel', text: "(A sharp crack echoes through the chamber) No, no… the seal!" },
        { speaker: 'Narrator', text: "[The crown fractures! A wave of violent purple magic bursts outward across the throne room.]" },
        { speaker: 'Mascot', text: "My heart…!" },
        { speaker: 'Narrator', text: "[The released energy spirals wildly toward the mascot.]" },
        { speaker: 'Hero', text: "Wait! Don't touch it!" },
        { speaker: 'Narrator', text: "[The mascot absorbs the swirling magic. Its body rises into the air as light and darkness twist around it.]" },
        { speaker: 'Mascot', text: "I can feel everything!" },
        { speaker: 'Mascot', text: "(Voice distorting into an echo) I can fix everything!" },
        { speaker: 'Narrator', text: "[Its body expands into a monstrous silhouette. The sky turns black.]" },
        { speaker: 'Hero', text: "What's happening to you?" },
        { speaker: 'Narrator', text: "[The transformed mascot unleashes a blast. The hero is thrown across the chamber.]" },
        { speaker: 'Hero', text: "No… what have I done?" }
      ];

      dialogue.playCutscene(act4Cutscene, () => {
        gameMaster.completeMilestone('crown_broken');
        sound.playVoidShoot();
        this.cameras.main.shake(900, 0.03);
        this.cameras.main.fade(1000, 0, 0, 0, false, (_cam: any, progress: number) => {
          if (progress === 1) {
            this.scene.start('Act5Scene');
          }
        });
      });
      return;
    }

    // Act V Climax: Scene 6 — The Choice & Nonlethal Resolution
    if (this.config.actKey === 'ACT_V') {
      if (this.bossHudEl) {
        this.bossHudEl.classList.add('hidden');
      }
      this.player.setVelocity(0, 0);
      sound.playBossDefeat();
      this.cameras.main.shake(600, 0.02);
      this.bossSprite.setTint(0xfde047);

      const playResolution = (branch: 'embrace' | 'strike') => {
        const resolutionLines: DialogueLine[] = branch === 'embrace' ? [
          { speaker: 'Narrator', text: "[The hero kneels upon the obsidian ground, lowering the weapon. The golden blade softens into a warm aura of sunlight.]" },
          { speaker: 'King Aurel', text: "What are you doing? It is wide open! Strike!" },
          { speaker: 'Hero', text: "Violence shattered this kingdom, King Aurel. It will never mend it." },
          { speaker: 'Mascot', text: "Please…" },
          { speaker: 'Hero', text: "I came here because I believed you needed a warrior. But I never stopped to ask what you needed." },
          { speaker: 'Mascot', text: "I wanted to be whole again." },
          { speaker: 'Hero', text: "I know." },
          { speaker: 'Mascot', text: "I wanted everything to go back to the way it was. I didn't want to hurt anyone." },
          { speaker: 'Hero', text: "Then let me help you stop." },
          { speaker: 'Narrator', text: "[The Heart of Dawn releases a wave of golden light. The darkness separates from the mascot, swirling around the arena.]" },
          { speaker: 'King Aurel', text: "Now! Let it go!" },
          { speaker: 'Narrator', text: "[The mascot closes its eyes. The hero reaches out and gently takes its paw.]" },
          { speaker: 'Hero', text: "You don't have to be afraid anymore." },
          { speaker: 'Mascot', text: "I'm still scared." },
          { speaker: 'Hero', text: "Then we'll be scared together." },
          { speaker: 'Narrator', text: "[The darkness dissolves into thousands of tiny lights. The mascot returns to its original form and falls into the hero's arms.]" },
          { speaker: 'Mascot', text: "I'm sorry." },
          { speaker: 'Hero', text: "So am I." }
        ] : [
          { speaker: 'Narrator', text: "[The hero lunges forward, swinging the golden blade with all their might!]" },
          { speaker: 'Narrator', text: "[A blinding flash erupts! But instead of cutting, the blade dissolves into thousands of gentle golden motes that envelop the trembling mascot!]" },
          { speaker: 'King Aurel', text: "The blade... it dissolved?! Why did it not strike?!" },
          { speaker: 'Hero', text: "The Heart of Dawn refuses to kill. It never was a weapon... it was a seal of love, not slaughter." },
          { speaker: 'Hero', text: "[Lowering empty hands and kneeling in the dust] I was wrong to fight you. I understand now." },
          { speaker: 'Mascot', text: "Please…" },
          { speaker: 'Hero', text: "I came here believing you were a monster to defeat. But you were hurting all along." },
          { speaker: 'Mascot', text: "I wanted to be whole again. I didn't want to hurt anyone." },
          { speaker: 'Hero', text: "Then let me help you stop." },
          { speaker: 'Narrator', text: "[The Heart of Dawn releases a wave of golden light. The darkness separates from the mascot, swirling around the arena.]" },
          { speaker: 'King Aurel', text: "Now! Let it go!" },
          { speaker: 'Narrator', text: "[The mascot closes its eyes. The hero reaches out and gently takes its paw.]" },
          { speaker: 'Hero', text: "You don't have to be afraid anymore." },
          { speaker: 'Mascot', text: "I'm still scared." },
          { speaker: 'Hero', text: "Then we'll be scared together." },
          { speaker: 'Narrator', text: "[The darkness dissolves into thousands of tiny lights. The mascot returns to its original form and falls into the hero's arms.]" },
          { speaker: 'Mascot', text: "I'm sorry." },
          { speaker: 'Hero', text: "So am I." }
        ];

        dialogue.playCutscene(resolutionLines, () => {
          sound.playMagicChime();
          this.cameras.main.fade(1400, 255, 255, 255, false, (_cam: any, progress: number) => {
            if (progress === 1) {
              this.scene.start('EpilogueScene');
            }
          });
        });
      };

      const act5InitialCutscene: DialogueLine[] = [
        { speaker: 'Narrator', text: "[The Heart of Dawn glows in the hero's hands. The mascot's monstrous form begins to weaken.]" },
        { speaker: 'King Aurel', text: "The darkness is exposed! You hold the Heart of Dawn in your hands." },
        {
          speaker: 'Heart of Dawn',
          text: "A golden blade forms above the Heart of Dawn. What choice will you make?",
          choices: [
            {
              text: "Lower Weapon & Reach Out Your Hand",
              onSelect: () => {
                gameMaster.completeMilestone('heart_of_dawn_choice');
                playResolution('embrace');
              }
            },
            {
              text: "Strike with Golden Blade",
              onSelect: () => {
                gameMaster.completeMilestone('heart_of_dawn_choice');
                playResolution('strike');
              }
            }
          ] as any
        }
      ];

      dialogue.playCutscene(act5InitialCutscene);
      return;
    }

    const bx = this.bossSprite.x;
    const by = this.bossSprite.y;

    sound.playBossDefeat();
    this.cameras.main.shake(600, 0.02);

    // Particle fireworks
    for (let i = 0; i < 28; i++) {
      const p = this.add.circle(
        bx + Phaser.Math.Between(-40, 40),
        by + Phaser.Math.Between(-50, 50),
        Phaser.Math.Between(6, 16),
        [0xf59e0b, 0xa855f7, 0x38bdf8, 0xef4444, 0xfde047][i % 5]
      );
      p.setDepth(20);
      const angle = (i / 28) * Math.PI * 2;
      const spd = Phaser.Math.Between(150, 320);
      this.tweens.add({
        targets: p,
        x: p.x + Math.cos(angle) * spd,
        y: p.y + Math.sin(angle) * spd,
        scale: 0,
        alpha: { from: 1, to: 0 },
        duration: 900 + Phaser.Math.Between(0, 300),
        onComplete: () => p.destroy()
      });
    }

    // Drop 15 victory coins!
    for (let i = 0; i < 15; i++) {
      const c = this.coinsGroup.create(
        bx + Phaser.Math.Between(-60, 60),
        by + Phaser.Math.Between(-30, 20),
        'coin'
      ) as Phaser.Physics.Arcade.Image;
      c.setDisplaySize(24, 24);
      (c.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      c.setDepth(15);
      this.tweens.add({
        targets: c,
        y: c.y - 15,
        duration: 800 + i * 50,
        yoyo: true,
        repeat: -1
      });
    }

    // Complete milestone if defined
    if (this.config.boss?.milestoneId) {
      gameMaster.completeMilestone(this.config.boss.milestoneId);
    }

    // Hide Boss HUD
    if (this.bossHudEl) {
      this.bossHudEl.classList.add('hidden');
    }

    // Set defeated boss sprite visual if available
    const bKey = this.config.boss?.key;
    if (bKey && this.textures.exists(`${bKey}_defeated`)) {
      this.bossSprite.setTexture(`${bKey}_defeated`);
    }

    // Fade out and destroy boss sprite
    this.tweens.add({
      targets: this.bossSprite,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 1200,
      onComplete: () => {
        if (this.bossSprite) this.bossSprite.destroy();
      }
    });
  }

  protected handlePlayerBossContact() {
    if (!this.bossSprite || !this.bossSprite.active || this.isBossDefeated || this.isInvulnerable || this.isTransitioning) return;

    if (this.isGuarding) {
      sound.playShieldBlock();
      const knockDir = this.player.x < this.bossSprite.x ? -1 : 1;
      this.player.setVelocity(knockDir * 320, -220);
      return;
    }

    // Deal 20 boss contact damage to player
    gameMaster.damagePlayer(20);
    const knockDir = this.player.x < this.bossSprite.x ? -1 : 1;
    this.triggerHeroHurt(knockDir * 360, -260, 420);
  }
}

