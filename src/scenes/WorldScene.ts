import Phaser from 'phaser';
import { gameMaster, GameAct } from '../core/GameMaster';
import { BackgroundDirector } from '../core/BackgroundDirector';

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: {
    A: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    W: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    Space: Phaser.Input.Keyboard.Key;
  };

  private groundGroup!: Phaser.Physics.Arcade.StaticGroup;
  private platformsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private bgDirector!: BackgroundDirector;
  private spawnData: { spawnX: number; act: GameAct } = { spawnX: 80, act: 'ACT_I' };

  constructor() {
    super('WorldScene');
  }

  init(data: { spawnX?: number; act?: GameAct }) {
    if (data.spawnX) this.spawnData.spawnX = data.spawnX;
    if (data.act) this.spawnData.act = data.act;
  }

  create() {
    const worldWidth = 5500;
    const worldHeight = 720;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    // 1. Build Multi-layered Panoramic Vector Backgrounds across 0–5,500 px
    this.bgDirector = new BackgroundDirector(this);
    this.bgDirector.createWorldBackgrounds();

    // 2. Build Solid Ground & Platforms for Navigating Backgrounds
    this.buildWorldGeometry();

    // 3. Create Vector Hero Player
    this.createPlayer();

    // 4. Camera Follow with Smooth Parallax Tracking
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // 5. Input Controls
    this.setupInput();

    // 6. Sync with GameMaster
    gameMaster.setAct(this.spawnData.act, 'Exploring the lands of Lumenfall');
    gameMaster.updateDOMHUD();
  }

  private buildWorldGeometry() {
    this.groundGroup = this.physics.add.staticGroup();
    this.platformsGroup = this.physics.add.staticGroup();

    const floorY = 640;
    const worldW = 5500;

    // Solid ground across the 5,500 px world
    for (let x = 0; x < worldW; x += 120) {
      const groundTile = this.add.rectangle(x + 60, floorY + 40, 120, 80, 0x1e293b, 0);
      this.groundGroup.add(groundTile);
    }

    // Elevated scenic observation platforms
    const observationPlatforms = [
      { x: 450, y: 520, w: 160 },   // Act I: Outskirts View
      { x: 850, y: 480, w: 160 },
      { x: 1450, y: 510, w: 180 },  // Act II: Corrupted Gorge View
      { x: 1850, y: 460, w: 160 },
      { x: 2450, y: 500, w: 200 },  // Act III: Sanctuary Waterfalls View
      { x: 2850, y: 440, w: 160 },
      { x: 3400, y: 520, w: 180 },  // Act IV: Castle Ramparts View
      { x: 3900, y: 480, w: 220 },  // Act IV: Grand Throne Room View
      { x: 4550, y: 520, w: 180 },  // Act V: Void Vortex View
      { x: 4850, y: 460, w: 180 },
      { x: 5300, y: 520, w: 200 }   // Epilogue: Restored Sunrise View
    ];

    observationPlatforms.forEach(p => {
      const plat = this.add.rectangle(p.x, p.y, p.w, 16, 0x334155, 0.7);
      plat.setStrokeStyle(1, 0x64748b, 0.8);
      this.platformsGroup.add(plat);
    });
  }

  private createPlayer() {
    this.player = this.physics.add.sprite(this.spawnData.spawnX, 550, 'hero_idle');
    this.player.setCollideWorldBounds(true);
    this.player.setDisplaySize(72, 96);
    this.player.setSize(44, 114);
    this.player.setOffset(26, 12);
    this.player.setDepth(10);
    if (this.anims.exists('hero_idle')) {
      this.player.anims.play('hero_idle');
    }

    this.physics.add.collider(this.player, this.groundGroup);
    this.physics.add.collider(this.player, this.platformsGroup);
  }

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = {
      A: this.input.keyboard!.addKey('A'),
      D: this.input.keyboard!.addKey('D'),
      W: this.input.keyboard!.addKey('W'),
      S: this.input.keyboard!.addKey('S'),
      Space: this.input.keyboard!.addKey('SPACE')
    };
  }

  update() {
    // 1. Update Parallax Background Director
    this.bgDirector.update(this.cameras.main.scrollX);

    // 2. Handle Player Movement
    this.handlePlayerMovement();

    // 3. Dynamic Region Tracking via GameMaster
    this.trackActByCameraX();
  }

  private handlePlayerMovement() {
    const speed = 280;
    const onFloor = (this.player.body as Phaser.Physics.Arcade.Body).onFloor();

    if (this.keys.A.isDown || this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
      if (onFloor && this.anims.exists('hero_run')) {
        this.player.anims.play('hero_run', true);
        this.player.setAngle(0);
      }
    } else if (this.keys.D.isDown || this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
      if (onFloor && this.anims.exists('hero_run')) {
        this.player.anims.play('hero_run', true);
        this.player.setAngle(0);
      }
    } else {
      this.player.setVelocityX(0);
      this.player.setAngle(0);
      if (onFloor && this.anims.exists('hero_idle')) {
        this.player.anims.play('hero_idle', true);
      }
    }

    if ((this.keys.W.isDown || this.keys.Space.isDown || this.cursors.up.isDown) && onFloor) {
      this.player.setVelocityY(-460);
      this.player.setAngle(0);
      if (this.anims.exists('hero_jump')) {
        this.player.anims.play('hero_jump', true);
      }
    } else if (!onFloor && this.anims.exists('hero_jump')) {
      this.player.anims.play('hero_jump', true);
    }
  }

  private trackActByCameraX() {
    const px = this.player.x;

    if (px < 1000 && gameMaster.currentAct !== 'ACT_I') {
      gameMaster.setAct('ACT_I', 'Act I: Lumenfall Outskirts & Forest Path (0–1,000 px)');
    } else if (px >= 1000 && px < 2000 && gameMaster.currentAct !== 'ACT_II') {
      gameMaster.setAct('ACT_II', 'Act II: The Corrupted Lands & Dark Miasma (1,000–2,000 px)');
    } else if (px >= 2000 && px < 3000 && gameMaster.currentAct !== 'ACT_III') {
      gameMaster.setAct('ACT_III', 'Act III: The Forgotten Sanctuary & Waterfalls (2,000–3,000 px)');
    } else if (px >= 3000 && px < 4100 && gameMaster.currentAct !== 'ACT_IV') {
      gameMaster.setAct('ACT_IV', 'Act IV: Castle Ramparts & The Grand Throne Room (3,000–4,100 px)');
    } else if (px >= 4100 && px < 5000 && gameMaster.currentAct !== 'ACT_V') {
      gameMaster.setAct('ACT_V', 'Act V: The Shattered Arena & Cosmic Void (4,100–5,000 px)');
    } else if (px >= 5000 && gameMaster.currentAct !== 'EPILOGUE') {
      gameMaster.setAct('EPILOGUE', 'Epilogue: Restored Lumenfall Sunrise (5,000–5,500 px)');
    }
  }
}
