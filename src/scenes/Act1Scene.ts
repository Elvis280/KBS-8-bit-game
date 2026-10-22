import Phaser from 'phaser';
import { ActBaseScene, ActConfig } from './ActBaseScene';
import { StrategicLayoutEngine } from '../core/StrategicLayoutEngine';

const layout = StrategicLayoutEngine.getAct1Layout();
StrategicLayoutEngine.validate(layout);

const act1Config: ActConfig = {
  actKey: 'ACT_I',
  actTitle: 'Act I: Lumenfall Outskirts — The Journey Begins',
  bgKey: 'bg1',
  worldWidth: 7200,
  worldHeight: 720,
  groundColor: 0x14532d,        // Lush emerald earth
  groundStrokeColor: 0x4ade80,  // Bright green grass edge
  groundTileKey: 'ground_act1_seamless',
  groundTileScale: 1.05,
  groundTileOffsetY: 47,
  groundDirtKey: 'ground_act1_dirt',
  groundDirtScale: 0.75,
  propOffsetY: 0,
  buildingOffsetY: 0,
  enemyOffsetY: 0,
  platformKeys: ['platform_act1_1', 'platform_act1_2', 'platform_act1_log', 'platform_act1_stone', 'platform_act1_moss'],
  boxKey: 'box_wood',           // Wooden crates
  useSingleSpriteProcedural: true, // Single pristine character sprite with expressive procedural motion & scaled-up elements
  heroJumpVelocity: -550,       // Generous 168px jump apex to comfortably vault elevated floating platforms

  // Strategic layout: pits reduced 20%, zero-overlap platforms & boxes
  groundSegments: layout.groundSegments,
  climbSurfaces: layout.climbSurfaces,
  boss: layout.boss,
  platforms: layout.platforms,
  boxes: layout.boxes,
  slimes: layout.slimes,
  npcs: layout.npcs,
  props: layout.props,
  buildings: layout.buildings,
  interactionPoints: layout.interactionPoints,
  coins: layout.coins,

  nextSceneKey: 'Act2Scene',
  nextSceneLabel: 'Enter Act II: The Corrupted Lands >',

  // Floating golden flower petals & spores
  createAmbientEffects: (scene: Phaser.Scene) => {
    for (let i = 0; i < 45; i++) {
      const petal = scene.add.circle(
        Phaser.Math.Between(50, 7150),
        Phaser.Math.Between(150, 620),
        Phaser.Math.Between(2, 4),
        0xfbbf24,
        0.65
      );
      petal.setDepth(20);
      scene.tweens.add({
        targets: petal,
        x: petal.x + Phaser.Math.Between(50, 120),
        y: petal.y + Phaser.Math.Between(-30, 40),
        alpha: { from: 0.2, to: 0.8 },
        duration: Phaser.Math.Between(3000, 5000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }
};

export class Act1Scene extends ActBaseScene {
  constructor() {
    super('Act1Scene', act1Config);
  }
}
