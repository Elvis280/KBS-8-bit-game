import Phaser from 'phaser';
import { sound } from '../audio/SoundSynth';
import { dialogue } from '../systems/DialogueDirector';
import { gameState } from '../systems/GameState';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background Panorama
    const bg = this.add.image(width / 2, height / 2, 'bg_act1');
    bg.setDisplaySize(width, height);
    bg.setTint(0x555577);

    // Dark gradient vignette
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x07090e, 0.65);

    // Golden particles / fireflies
    for (let i = 0; i < 35; i++) {
      const p = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 3),
        0xf59e0b,
        0.7
      );
      this.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(30, 80),
        alpha: { from: 0.2, to: 0.9 },
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Title Text
    const title = this.add.text(width / 2, height / 2 - 120, 'THE CROWN THAT HELD THE DARK', {
      fontFamily: 'Cinzel, serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#f59e0b',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    const subtitle = this.add.text(width / 2, height / 2 - 60, 'A Whimsical Storybook Adventure', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '17px',
      color: '#fef3c7',
      align: 'center'
    }).setOrigin(0.5);

    // Title Menu Options
    const startBtn = this.createMenuButton(width / 2, height / 2 + 20, 'Begin Journey (Act I)', () => {
      this.playPrologue();
    });

    const actSelectBtn = this.createMenuButton(width / 2, height / 2 + 75, 'Act Selection (Teleport)', () => {
      this.showActSelect();
    });

    const prologueBtn = this.createMenuButton(width / 2, height / 2 + 130, 'Prologue Cinematic', () => {
      this.playPrologue();
    });

    const controlsBtn = this.createMenuButton(width / 2, height / 2 + 185, 'Controls & Story Guide', () => {
      const controlsModal = document.getElementById('controls-modal');
      controlsModal?.classList.remove('hidden');
    });

    // Start Prologue Ambient audio
    sound.playBGM('prologue');
    sound.playDistantBell();
  }

  private createMenuButton(x: number, y: number, text: string, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 320, 42, 0x241c17, 0.92);
    bg.setStrokeStyle(1.8, 0xd97706, 0.7);

    const label = this.add.text(0, 0, text, {
      fontFamily: 'Cinzel, serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#fdfaf2'
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(320, 42);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.setFillStyle(0xf59e0b, 1);
      bg.setStrokeStyle(2, 0xfde047, 1);
      label.setColor('#1c1511');
      container.setScale(1.04);
      sound.playTypewriter();
    });

    container.on('pointerout', () => {
      bg.setFillStyle(0x241c17, 0.92);
      bg.setStrokeStyle(1.8, 0xd97706, 0.7);
      label.setColor('#fdfaf2');
      container.setScale(1.0);
    });

    container.on('pointerdown', () => {
      sound.playCoin();
      onClick();
    });

    return container;
  }

  private playPrologue() {
    sound.playDistantBell();

    dialogue.playCutscene([
      {
        speaker: 'NARRATOR',
        text: 'Before the kingdom of Lumenfall had a king, it had a miracle.'
      },
      {
        speaker: 'NARRATOR',
        text: 'A little creature wandered through empty fields, leaving flowers in its footsteps. Rivers followed its dreams. Trees grew where it laughed. And the people of Lumenfall called it their guardian.'
      },
      {
        speaker: 'NARRATOR',
        text: 'But the creature possessed a power even it could not understand. It could create life. And when its fear became stronger than its love, it could unmake it.'
      },
      {
        speaker: 'NARRATOR',
        text: 'One night, the sky turned black. The earth split. The rivers stopped. Shadows swallowed entire villages. And in the heart of the disaster, one man made a choice.'
      },
      {
        speaker: 'YOUNG AUREL',
        portrait: '/assets/svg/young_aurel.svg',
        text: '"Forgive me."'
      },
      {
        speaker: 'NARRATOR',
        text: 'Aurel bound the creature\'s power to himself. The kingdom survived. But the crown did not release its prisoner. And its prisoner did not release its king.'
      },
      {
        speaker: 'NARRATOR',
        text: 'Years passed. The flowers withered. The rivers darkened. Monsters appeared along the roads. The people saw a king who had become a tyrant. They never saw the chain beneath his crown.'
      }
    ], () => {
      this.scene.start('Act1Scene');
    });
  }

  private showActSelect() {
    dialogue.playCutscene([
      {
        speaker: 'HERO',
        text: 'Select which Act of the chronicle to enter:',
        choices: [
          { text: 'Act I — Lumenfall Outskirts', onSelect: () => this.scene.start('Act1Scene') },
          { text: 'Act II — The Corrupted Lands', onSelect: () => this.scene.start('Act2Scene') },
          { text: 'Act III — Forgotten Sanctuary', onSelect: () => this.scene.start('Act3Scene') },
          { text: 'Act IV — Castle Ramparts & Throne', onSelect: () => this.scene.start('Act4Scene') },
          { text: 'Act V — The Shattered Arena', onSelect: () => this.scene.start('Act5Scene') },
          { text: 'Epilogue — Restored Sunrise', onSelect: () => this.scene.start('EpilogueScene') }
        ]
      }
    ]);
  }
}
