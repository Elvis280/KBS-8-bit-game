import Phaser from 'phaser';
import { ActBaseScene, ActConfig } from './ActBaseScene';
import { StrategicLayoutEngine } from '../core/StrategicLayoutEngine';
import { gameMaster } from '../core/GameMaster';
import { sound } from '../audio/SoundSynth';
import { dialogue, DialogueLine } from '../systems/DialogueDirector';

const layout = StrategicLayoutEngine.getAct4Layout();
StrategicLayoutEngine.validate(layout);

const act4Config: ActConfig = {
  actKey: 'ACT_IV',
  actTitle: 'Act IV: Castle Ramparts & Grand Throne Room',
  bgKey: 'bg4', // Starts on exterior ramparts half (bg4_exterior.png)
  worldWidth: 7200,
  worldHeight: 720,
  groundColor: 0x334155,        // Castle slate & cobblestone
  groundStrokeColor: 0xf59e0b,  // Gilded royal edge
  groundTileKey: 'ground_act4_seamless',
  groundTileScale: 0.35,
  groundTileOffsetY: 28,
  groundDirtKey: 'ground_act4_dirt',
  groundDirtScale: 0.75,
  propOffsetY: 12,
  buildingOffsetY: 12,
  enemyOffsetY: 12,
  platformKeys: ['platform_act4'],
  boxKey: 'box_metal',          // Iron-bound castle armory crates
  hazardBoxKey: 'box_spike_metal', // Spiked iron fortress traps

  // Strategic layout: pits reduced 20%, zero-overlap platforms & boxes
  groundSegments: layout.groundSegments,
  climbSurfaces: layout.climbSurfaces,
  boss: layout.boss,
  platforms: layout.platforms,
  boxes: layout.boxes,
  hazardBoxes: layout.hazardBoxes,
  slimes: layout.slimes,
  npcs: layout.npcs,
  props: layout.props,
  buildings: layout.buildings,
  interactionPoints: layout.interactionPoints,
  coins: layout.coins,

  nextSceneKey: 'Act5Scene',
  nextSceneLabel: 'Enter Act V: The Shattered Arena >',

  // Castle banner sparks and royal dust motes
  createAmbientEffects: (scene: Phaser.Scene) => {
    for (let i = 0; i < 46; i++) {
      const spark = scene.add.circle(
        Phaser.Math.Between(50, 7150),
        Phaser.Math.Between(150, 620),
        Phaser.Math.Between(1.5, 3.5),
        0xfbbf24,
        0.7
      );
      spark.setDepth(20);
      scene.tweens.add({
        targets: spark,
        y: spark.y - Phaser.Math.Between(40, 90),
        alpha: { from: 0.8, to: 0 },
        duration: Phaser.Math.Between(1800, 3200),
        repeat: -1,
        ease: 'Power1'
      });
    }
  }
};

export class Act4Scene extends ActBaseScene {
  public isCastleUnlocked: boolean = false;
  public isInThroneRoom: boolean = false;
  private castleGateWall: Phaser.GameObjects.Rectangle | null = null;
  private castlePortcullisBars: Phaser.GameObjects.Rectangle[] = [];
  private throneRoomCarpet: Phaser.GameObjects.Rectangle | null = null;
  private interiorWallCollider: Phaser.GameObjects.Rectangle | null = null;

  constructor() {
    super('Act4Scene', act4Config);
  }

  create() {
    super.create();

    // 1. Clamp camera initially to the exterior ramparts (0 to 4820 px)
    this.cameras.main.setBounds(0, 0, 4820, 720);

    // 2. Build architectural Castle Portcullis & physical barrier at x = 4800
    this.buildCastleGate();
  }

  /**
   * Constructs the grand Castle Entrance Gate on the high bastion at x = 4800, y = 400
   */
  private buildCastleGate() {
    const gateX = 4800;
    const gateGroundY = 400;

    // Left and Right Castle Towers / Stone Pillars
    const leftPillar = this.add.rectangle(gateX - 35, gateGroundY - 140, 36, 280, 0x1e293b);
    leftPillar.setStrokeStyle(3, 0xf59e0b);
    leftPillar.setDepth(5);

    const rightPillar = this.add.rectangle(gateX + 35, gateGroundY - 140, 36, 280, 0x1e293b);
    rightPillar.setStrokeStyle(3, 0xf59e0b);
    rightPillar.setDepth(5);

    // Stone Archway Header
    const archHeader = this.add.rectangle(gateX, gateGroundY - 270, 110, 40, 0x0f172a);
    archHeader.setStrokeStyle(3, 0xf59e0b);
    archHeader.setDepth(6);

    // Royal Gilded Heraldry Banner
    const banner = this.add.rectangle(gateX, gateGroundY - 240, 50, 70, 0x991b1b);
    banner.setStrokeStyle(2, 0xfde047);
    banner.setDepth(6);

    const bannerEmblem = this.add.circle(gateX, gateGroundY - 240, 10, 0xfde047);
    bannerEmblem.setDepth(7);

    // Two Flaming Bastion Torches
    const leftTorch = this.add.circle(gateX - 35, gateGroundY - 160, 6, 0xf97316);
    leftTorch.setDepth(7);
    this.tweens.add({
      targets: leftTorch,
      alpha: { from: 0.6, to: 1.0 },
      scale: { from: 0.8, to: 1.3 },
      duration: 250,
      yoyo: true,
      repeat: -1
    });

    const rightTorch = this.add.circle(gateX + 35, gateGroundY - 160, 6, 0xf97316);
    rightTorch.setDepth(7);
    this.tweens.add({
      targets: rightTorch,
      alpha: { from: 0.6, to: 1.0 },
      scale: { from: 0.8, to: 1.3 },
      duration: 280,
      yoyo: true,
      repeat: -1
    });

    // 6 Vertical Iron Portcullis Bars
    this.castlePortcullisBars = [];
    for (let i = 0; i < 6; i++) {
      const barX = gateX - 25 + i * 10;
      const bar = this.add.rectangle(barX, gateGroundY - 130, 4, 240, 0x475569);
      bar.setStrokeStyle(1, 0x0f172a);
      bar.setDepth(5);
      this.castlePortcullisBars.push(bar);
    }

    // Solid Physics Barrier Wall stopping player before unlocking castle
    const wall = this.add.rectangle(gateX, gateGroundY - 140, 24, 280, 0x000000, 0);
    this.physics.add.existing(wall, true);
    this.physics.add.collider(this.player, wall);
    this.castleGateWall = wall;
  }

  /**
   * Overrides interaction points to provide rich unlocking choices at the Castle Gate
   */
  protected interactWithPoint(point: Phaser.Physics.Arcade.Sprite) {
    const title = point.getData('title') as string | undefined;

    // Throne Chamber Gates interaction point
    if (title === 'Throne Chamber Gates') {
      const lines = point.getData('lines') as { speaker: string; text: string }[] || [];
      const formattedLines: DialogueLine[] = lines.map(l => ({
        speaker: l.speaker,
        text: l.text
      }));

      if (gameMaster.goldenKeyUnlocked) {
        formattedLines.push({
          speaker: 'Castle Portcullis',
          text: 'The Golden Castle Key fits the ancient royal lock! Turn the key to unbar the portcullis and enter the Grand Throne Room?',
          choices: [
            {
              text: 'Turn Golden Key & Enter Throne Room',
              onSelect: () => {
                this.transitionToThroneRoom();
              }
            },
            {
              text: 'Stay on Ramparts for Now',
              onSelect: () => {}
            }
          ] as any
        });
      } else if (gameMaster.coins >= 40) {
        formattedLines.push({
          speaker: 'Castle Portcullis',
          text: `You hold ${gameMaster.coins} gold coins. Insert 40 coins into the royal forge mechanism to forge the Golden Castle Key and unseal the Grand Throne Room?`,
          choices: [
            {
              text: 'Insert 40 Coins & Forge Key',
              onSelect: () => {
                gameMaster.spendCoins(40);
                gameMaster.goldenKeyUnlocked = true;
                gameMaster.completeMilestone('gate_machine_unlocked');
                this.transitionToThroneRoom();
              }
            },
            {
              text: 'Stay on Ramparts for Now',
              onSelect: () => {}
            }
          ] as any
        });
      } else {
        const remaining = 40 - gameMaster.coins;
        formattedLines.push({
          speaker: 'Castle Portcullis',
          text: `The massive iron portcullis is barred tight. The ancient mechanism requires 40 gold coins to forge the Castle Key (${gameMaster.coins} / 40 held — ${remaining} more needed). Explore the ramparts and defeat corrupted sentries to gather the remaining gold!`,
          choices: [
            {
              text: 'Search the Ramparts for Coins',
              onSelect: () => {}
            }
          ] as any
        });
      }

      this.hideInteractionPrompt();
      sound.playMagicChime();
      dialogue.playCutscene(formattedLines, () => {
        this.checkNPCProximity();
      });
      return;
    }

    // Default handling for other interaction points (Machine of Kings, etc.)
    super.interactWithPoint(point);
  }

  /**
   * Dramatic cinematic transition to the inside of the castle:
   * Swaps background to the interior half (bg4_interior.png), locks camera to throne room arena,
   * seals entrance gate behind hero, and carries on the King Aurel boss battle there!
   */
  public transitionToThroneRoom() {
    if (this.isInThroneRoom || this.isTransitioning) return;
    this.isTransitioning = true;
    this.isCastleUnlocked = true;
    this.player.setVelocity(0, 0);

    // 1. Play heavy door unlocking sound and royal chime
    sound.playCrownCrack();
    sound.playMagicChime();

    // 2. Animate the exterior portcullis bars rising
    if (this.castlePortcullisBars.length > 0) {
      this.tweens.add({
        targets: this.castlePortcullisBars,
        y: '-=160',
        duration: 800,
        ease: 'Cubic.easeOut'
      });
    }

    // 3. Screen fades out to deep royal indigo
    this.cameras.main.fade(800, 8, 5, 20, false, (_cam: any, progress: number) => {
      if (progress === 1) {
        this.isInThroneRoom = true;

        // 4. Switch background to the other half: bg4_interior (Cathedral Throne Room)
        if (this.bgImage) {
          this.bgImage.setTexture('bg4_interior');
          this.bgImage.setDisplaySize(1800, 720);
          this.bgImage.setScrollFactor(0);
          this.bgImage.setPosition(0, 0);
        }

        // 5. Expand and lock camera bounds to the Grand Throne Room (4800 to 7200 px)
        this.cameras.main.setBounds(4800, 0, 2400, 720);

        // 6. Teleport Hero to the entrance of the Grand Throne Room
        this.player.setPosition(4960, 500);
        this.player.setVelocity(0, 0);
        this.lastCheckpointX = 4960;
        this.lastCheckpointY = 500;

        // 7. Teleport Mascot companion to follow hero's shoulder
        if (this.mascotCompanion) {
          this.mascotCompanion.setPosition(4910, 460);
        }

        // 8. Remove exterior gate barrier and build sealed interior portcullis behind hero
        if (this.castleGateWall) {
          this.castleGateWall.destroy();
          this.castleGateWall = null;
        }
        const interiorWall = this.add.rectangle(4860, 400, 32, 400, 0x1e293b);
        interiorWall.setStrokeStyle(3, 0xf59e0b);
        interiorWall.setDepth(6);
        this.physics.add.existing(interiorWall, true);
        this.physics.add.collider(this.player, interiorWall);
        this.interiorWallCollider = interiorWall;

        // 9. Crimson royal carpet runner along the grand throne hall floor
        const carpet = this.add.rectangle(5900, 538, 2000, 10, 0x991b1b);
        carpet.setStrokeStyle(2, 0xfbbf24);
        carpet.setDepth(2);
        this.throneRoomCarpet = carpet;

        // 10. Position King Aurel before his grand throne
        if (this.bossSprite) {
          this.bossSprite.setPosition(6000, 540);
          this.bossSprite.setVelocity(0, 0);
          this.bossSprite.setFlipX(true); // Facing left toward the hero
        }

        // 11. Screen fades back in
        this.cameras.main.fadeIn(800, 0, 0, 0);
        sound.playShieldBreak(); // Heavy iron portcullis slam sealing the chamber!

        // 12. Display cinematic on-screen title card
        this.showThroneRoomTitleBanner();

        // 13. King Aurel confrontation cutscene & boss battle initiation
        this.time.delayedCall(1200, () => {
          this.startKingAurelThroneDialogue();
        });
      }
    });
  }

  /**
   * Displays cinematic title card: "THE GRAND THRONE ROOM"
   */
  private showThroneRoomTitleBanner() {
    const bannerContainer = this.add.container(640, 180);
    bannerContainer.setScrollFactor(0);
    bannerContainer.setDepth(100);
    bannerContainer.setAlpha(0);

    const bannerBg = this.add.rectangle(0, 0, 620, 90, 0x07090e, 0.88);
    bannerBg.setStrokeStyle(2, 0xf59e0b);

    const titleText = this.add.text(0, -14, 'THE GRAND THRONE ROOM', {
      fontFamily: 'Cinzel, serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#fef08a'
    }).setOrigin(0.5);
    titleText.setStroke('#000', 3);

    const subText = this.add.text(0, 18, 'Confrontation with King Aurel, Bearer of the Crown', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '13px',
      color: '#cbd5e1'
    }).setOrigin(0.5);

    bannerContainer.add([bannerBg, titleText, subText]);

    this.tweens.add({
      targets: bannerContainer,
      alpha: 1,
      y: 190,
      duration: 500,
      hold: 2400,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => {
        bannerContainer.destroy();
      }
    });
  }

  /**
   * Triggers the confrontation dialogue between Hero, King Aurel, and Mascot before combat commences
   */
  private startKingAurelThroneDialogue() {
    const confrontationLines: DialogueLine[] = [
      { speaker: 'King Aurel', text: 'So. The little wanderer has entered my sanctuary. You have crossed a dying kingdom to stand before me.' },
      { speaker: 'King Aurel', text: 'Tell me, child... do you truly know what you are fighting for?' },
      { speaker: 'Hero', text: 'I know what your darkness did to this land. The empty villages, the terrified people, the miasma choking the forest.' },
      { speaker: 'King Aurel', text: 'You understand nothing! The crown is the only vessel strong enough to contain the primordial void! If I fall, the darkness will swallow everything!' },
      { speaker: 'Mascot', text: 'He\'s lying! He stole my power and trapped it in that cruel crown!' },
      { speaker: 'Hero', text: 'You thought silence was protection, Aurel. But it only made you a tyrant. Let the people go!' },
      { speaker: 'King Aurel', text: 'Then come, wanderer! Face the sovereign of Lumenfall!' }
    ];

    dialogue.playCutscene(confrontationLines, () => {
      this.isTransitioning = false;
      this.isBossActive = true;
      if (this.bossSprite) {
        sound.playBossRoar();
        this.bossSprite.setTint(0xf87171);
        this.time.delayedCall(400, () => {
          if (this.bossSprite) this.bossSprite.clearTint();
        });
      }
      this.updateBossHpBar();
      if (this.bossOverheadContainer) {
        this.tweens.add({
          targets: this.bossOverheadContainer,
          alpha: 1,
          duration: 400
        });
      }
      if (this.bossHudEl) {
        this.bossHudEl.classList.remove('hidden');
        if (this.bossNameEl) this.bossNameEl.textContent = 'King Aurel, Bearer of the Crown';
        if (this.bossPhaseTextEl) this.bossPhaseTextEl.textContent = 'Phase 1: Corrupted Sovereign';
      }
      const interval = this.config.boss?.attackInterval || 2500;
      this.bossAttackTimer = this.time.addEvent({
        delay: interval,
        callback: this.triggerBossAttack,
        callbackScope: this,
        loop: true
      });
    });
  }

  update() {
    super.update();

    // In the Grand Throne Room, smoothly parallax-pan the interior background (bg4_interior)
    // so the glowing Crown and golden throne remain prominently centered
    if (this.isInThroneRoom && this.bgImage) {
      const minCamX = 4800;
      const maxCamX = 7200 - 1280; // 5920 px
      const progress = Phaser.Math.Clamp((this.cameras.main.scrollX - minCamX) / (maxCamX - minCamX), 0, 1);
      this.bgImage.x = -progress * (1800 - 1280);
      this.bgImage.y = 0;
    }

    // If unlocked on exterior and hero passes the gate threshold, trigger transition automatically
    if (this.isCastleUnlocked && !this.isInThroneRoom && this.player && this.player.x >= 4780) {
      this.transitionToThroneRoom();
    }
  }
}
