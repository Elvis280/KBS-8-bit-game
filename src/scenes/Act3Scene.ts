import Phaser from 'phaser';
import { ActBaseScene, ActConfig } from './ActBaseScene';
import { StrategicLayoutEngine } from '../core/StrategicLayoutEngine';

const layout = StrategicLayoutEngine.getAct3Layout();
StrategicLayoutEngine.validate(layout);

const act3Config: ActConfig = {
  actKey: 'ACT_III',
  actTitle: 'Act III: The Forgotten Sanctuary — Buried Truth',
  bgKey: 'bg3',
  worldWidth: 7200,
  worldHeight: 720,
  groundColor: 0x0f172a,        // Deep subterranean blue-slate
  groundStrokeColor: 0x38bdf8,  // Glowing cyan sanctuary stone trim
  groundTileKey: 'ground_act3_seamless',
  groundTileScale: 0.35,
  groundTileOffsetY: 28,
  groundDirtKey: 'ground_act3_dirt',
  groundDirtScale: 0.75,
  propOffsetY: 12,
  buildingOffsetY: 12,
  enemyOffsetY: 12,
  platformKeys: ['platform_act3'],
  boxKey: 'box_temple',         // Ancient sanctuary temple blocks
  hazardBoxKey: 'box_spike_temple', // Spiked temple electric hazard traps

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

  nextSceneKey: 'Act4Scene',
  nextSceneLabel: 'Enter Act IV: Castle Ramparts & Throne >',

  // Glowing cyan water vapor & divine sanctuary motes
  createAmbientEffects: (scene: Phaser.Scene) => {
    for (let i = 0; i < 44; i++) {
      const mist = scene.add.circle(
        Phaser.Math.Between(50, 7150),
        Phaser.Math.Between(150, 620),
        Phaser.Math.Between(2, 5),
        0x38bdf8,
        0.55
      );
      mist.setDepth(20);
      scene.tweens.add({
        targets: mist,
        y: mist.y + Phaser.Math.Between(-35, 35),
        alpha: { from: 0.15, to: 0.75 },
        duration: Phaser.Math.Between(2500, 4500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }
};

export class Act3Scene extends ActBaseScene {
  constructor() {
    super('Act3Scene', act3Config);
  }
}
