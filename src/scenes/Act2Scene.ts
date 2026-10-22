import Phaser from 'phaser';
import { ActBaseScene, ActConfig } from './ActBaseScene';
import { StrategicLayoutEngine } from '../core/StrategicLayoutEngine';

const layout = StrategicLayoutEngine.getAct2Layout();
StrategicLayoutEngine.validate(layout);

const act2Config: ActConfig = {
  actKey: 'ACT_II',
  actTitle: 'Act II: The Corrupted Lands — Shadows Deepen',
  bgKey: 'bg2',
  worldWidth: 7200,
  worldHeight: 720,
  groundColor: 0x1e1035,        // Scorched corrupted dark earth
  groundStrokeColor: 0xa855f7,  // Glowing violet miasma edge
  groundTileKey: 'ground_act2_seamless',
  groundTileScale: 0.75,
  groundTileOffsetY: 0,
  groundDirtKey: 'ground_act2_dirt',
  groundDirtScale: 0.75,
  propOffsetY: 0,
  buildingOffsetY: 0,
  enemyOffsetY: 0,
  platformKeys: ['platform_act2_1', 'platform_act2_2', 'platform_act2_3'],
  boxKey: 'box_corrupt',        // Corrupted obsidian rune blocks
  hazardBoxKey: 'box_spike_corrupt', // Spiked corrupted hazard crates
  useSingleSpriteProcedural: true,
  heroJumpVelocity: -550,

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

  nextSceneKey: 'Act3Scene',
  nextSceneLabel: 'Enter Act III: The Forgotten Sanctuary >',

  // Floating purple corrupted embers
  createAmbientEffects: (scene: Phaser.Scene) => {
    for (let i = 0; i < 46; i++) {
      const ember = scene.add.circle(
        Phaser.Math.Between(50, 7150),
        Phaser.Math.Between(180, 620),
        Phaser.Math.Between(1, 3),
        0xc084fc,
        0.75
      );
      ember.setDepth(20);
      scene.tweens.add({
        targets: ember,
        y: ember.y - Phaser.Math.Between(60, 140),
        alpha: { from: 0.8, to: 0 },
        duration: Phaser.Math.Between(2000, 3600),
        repeat: -1,
        ease: 'Power1'
      });
    }
  }
};

export class Act2Scene extends ActBaseScene {
  constructor() {
    super('Act2Scene', act2Config);
  }
}
