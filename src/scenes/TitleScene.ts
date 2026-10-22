import Phaser from 'phaser';
import { sound } from '../audio/SoundSynth';
import { dialogue } from '../systems/DialogueDirector';
import { gameState } from '../systems/GameState';
import { gameMaster } from '../core/GameMaster';

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
    const startBtn = this.createMenuButton(width / 2, height / 2 + 20, 'Begin Journey', () => {
      this.playBeginJourneyCutscene();
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

  /**
   * Cinematic cutscene triggered when clicking "Begin Journey":
   * The traveler hears cries for help, clears the heavy enchanted rubble,
   * rescues the trapped mascot Zeno, and starts Act 1 with Zeno accompanying them!
   */
  private playBeginJourneyCutscene() {
    sound.playDistantBell();

    dialogue.playCutscene([
      {
        speaker: 'NARRATOR',
        text: 'A quiet mist hangs over the outskirts of Lumenfall. A lone traveler walks the desolate borderlands… until a faint, desperate cry breaks the silence.'
      },
      {
        speaker: 'Zeno',
        portrait: '/assets/portraits/game/mascot_portrait.png',
        text: 'Help! Is anyone there?! Please… the stones are too heavy… I can’t breathe!'
      },
      {
        speaker: 'Hero',
        portrait: '/assets/portraits/game/hero_portrait.png',
        text: 'Hold on! Stay completely still. I’m lifting the rubble right now!'
      },
      {
        speaker: 'NARRATOR',
        text: 'With a surge of strength, the traveler heaves the crushing timber and dark stones aside, pulling the luminous creature safely from the debris.'
      },
      {
        speaker: 'Zeno',
        portrait: '/assets/portraits/game/mascot_portrait.png',
        text: 'You… you actually came back for me! Nobody stops to help anymore…'
      },
      {
        speaker: 'Hero',
        portrait: '/assets/portraits/game/hero_portrait.png',
        text: 'I wasn’t about to leave you trapped out here in the dark. Are you hurt?'
      },
      {
        speaker: 'Zeno',
        portrait: '/assets/portraits/game/mascot_portrait.png',
        text: 'My name is Zeno! King Krish stole my heart and locked it away inside the castle crown to feed his dark magic. Without it, the land will wither forever.'
      },
      {
        speaker: 'Hero',
        portrait: '/assets/portraits/game/hero_portrait.png',
        text: 'Then we go to the castle together, Zeno. Stay close to me—let’s take back what was stolen!'
      },
      {
        speaker: 'Zeno',
        portrait: '/assets/portraits/game/mascot_portrait.png',
        text: 'Thank you! Together, we can restore the light to Lumenfall!'
      }
    ], () => {
      // Mark mascot as rescued so Zeno immediately accompanies the hero across Act 1
      gameMaster.completeMilestone('mascot_rescued');
      gameState.hasRescuedMascot = true;
      sound.playMagicChime();
      this.cameras.main.fade(600, 0, 0, 0, false, (_cam: any, progress: number) => {
        if (progress === 1) {
          this.scene.start('Act1Scene');
        }
      });
    });
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
        text: 'A little creature named Zeno wandered through empty fields, leaving flowers in its footsteps. Rivers followed its dreams. Trees grew where it laughed. And the people of Lumenfall called it their guardian.'
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
        speaker: 'YOUNG KRISH',
        portrait: '/assets/svg/young_aurel.svg',
        text: '"Forgive me."'
      },
      {
        speaker: 'NARRATOR',
        text: 'Krish bound the creature\'s power to himself. The kingdom survived. But the crown did not release its prisoner. And its prisoner did not release its king.'
      },
      {
        speaker: 'NARRATOR',
        text: 'Years passed. The flowers withered. The rivers darkened. Monsters appeared along the roads. The people saw a king who had become a tyrant. They never saw the chain beneath his crown.'
      }
    ], () => {
      this.playBeginJourneyCutscene();
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
