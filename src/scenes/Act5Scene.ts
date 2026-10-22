import Phaser from 'phaser';
import { ActBaseScene, ActConfig } from './ActBaseScene';
import { StrategicLayoutEngine } from '../core/StrategicLayoutEngine';

const layout = StrategicLayoutEngine.getAct5Layout();
StrategicLayoutEngine.validate(layout);

const act5Config: ActConfig = {
  actKey: 'ACT_V',
  actTitle: 'Act V: The Shattered Arena — The Heart of Dawn',
  bgKey: 'bg5',
  worldWidth: 7200,
  worldHeight: 720,
  groundColor: 0x0f071b,        // Cosmic dark obsidian rock
  groundStrokeColor: 0xec4899,  // Neon magenta void gravity boundary
  groundTileKey: 'ground_act5_seamless',
  groundTileScale: 0.35,
  groundTileOffsetY: 39,
  groundDirtKey: 'ground_act5_dirt',
  groundDirtScale: 0.75,
  propOffsetY: 12,
  buildingOffsetY: 12,
  enemyOffsetY: 12,
  platformKeys: ['platform_act5'],
  boxKey: 'box_void',           // Floating void crystal blocks
  hazardBoxKey: 'box_spike_void', // Antimatter volatile void spike crystals
  useSingleSpriteProcedural: true,
  heroJumpVelocity: -550,
  hazardShoots: true,              // Spiked boxes fire slow-moving bullets!
  hazardShootInterval: 2000,       // Interval of 2 seconds
  hazardBulletSpeed: 110,          // Slow-moving projectile speed
  hazardBulletKey: 'void_bullet',

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

  nextSceneKey: 'EpilogueScene',
  nextSceneLabel: 'Awaken Epilogue: Restored Sunrise >',

  // Swirling void gravity sparks
  createAmbientEffects: (scene: Phaser.Scene) => {
    for (let i = 0; i < 48; i++) {
      const spark = scene.add.circle(
        Phaser.Math.Between(50, 7150),
        Phaser.Math.Between(100, 620),
        Phaser.Math.Between(2, 4),
        0xa855f7,
        0.8
      );
      spark.setDepth(20);
      scene.tweens.add({
        targets: spark,
        x: spark.x - Phaser.Math.Between(50, 120),
        y: spark.y - Phaser.Math.Between(30, 80),
        scale: { from: 1, to: 0.2 },
        duration: Phaser.Math.Between(1800, 3000),
        repeat: -1,
        ease: 'Quad.easeIn'
      });
    }
  }
};

export class Act5Scene extends ActBaseScene {
  constructor() {
    super('Act5Scene', act5Config);
  }
}
