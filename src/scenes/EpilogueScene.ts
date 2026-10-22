import Phaser from 'phaser';
import { ActBaseScene, ActConfig } from './ActBaseScene';
import { StrategicLayoutEngine } from '../core/StrategicLayoutEngine';

const layout = StrategicLayoutEngine.getEpilogueLayout();
StrategicLayoutEngine.validate(layout);

const epilogueConfig: ActConfig = {
  actKey: 'EPILOGUE',
  actTitle: 'Epilogue: A Kingdom Without a Crown — Restored Sunrise',
  bgKey: 'epilog-bg',
  worldWidth: 5400,
  worldHeight: 720,
  groundColor: 0x15803d,        // Lush healed emerald grass
  groundStrokeColor: 0xfef08a,  // Golden dawn flower trim
  groundTileKey: 'ground_act1_seamless',
  groundTileScale: 1.05,
  groundTileOffsetY: 35,
  groundDirtKey: 'ground_act1_dirt',
  groundDirtScale: 0.75,
  propOffsetY: 12,
  buildingOffsetY: 12,
  platformKeys: ['platform_act1_1', 'platform_act1_2', 'platform_act1_moss', 'platform_act1_stone'],
  boxKey: 'box_wood',

  // Strategic layout: pits reduced 20%, zero-overlap platforms & boxes
  groundSegments: layout.groundSegments,
  climbSurfaces: layout.climbSurfaces,
  platforms: layout.platforms,
  boxes: layout.boxes,
  npcs: layout.npcs,
  props: layout.props,
  buildings: layout.buildings,
  interactionPoints: layout.interactionPoints,
  coins: layout.coins,

  nextSceneKey: 'TitleScene',
  nextSceneLabel: 'Chronicle Complete — Return to Title >',

  // Golden sunbeams and floating flower pollen
  createAmbientEffects: (scene: Phaser.Scene) => {
    for (let i = 0; i < 46; i++) {
      const mote = scene.add.circle(
        Phaser.Math.Between(50, 5350),
        Phaser.Math.Between(150, 620),
        Phaser.Math.Between(2, 4),
        0xfde047,
        0.75
      );
      mote.setDepth(20);
      scene.tweens.add({
        targets: mote,
        y: mote.y - Phaser.Math.Between(30, 80),
        alpha: { from: 0.25, to: 0.85 },
        duration: Phaser.Math.Between(2500, 4500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }
};

export class EpilogueScene extends ActBaseScene {
  constructor() {
    super('EpilogueScene', epilogueConfig);
  }
}
