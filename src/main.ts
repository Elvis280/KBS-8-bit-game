import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { WorldScene } from './scenes/WorldScene';
import { Act1Scene } from './scenes/Act1Scene';
import { Act2Scene } from './scenes/Act2Scene';
import { Act3Scene } from './scenes/Act3Scene';
import { Act4Scene } from './scenes/Act4Scene';
import { Act5Scene } from './scenes/Act5Scene';
import { EpilogueScene } from './scenes/EpilogueScene';
import { sound } from './audio/SoundSynth';
import { gameMaster } from './core/GameMaster';
import { gameState } from './systems/GameState';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-canvas',
  width: 1280,
  height: 720,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 900, x: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    BootScene,
    TitleScene,
    Act1Scene,
    Act2Scene,
    Act3Scene,
    Act4Scene,
    Act5Scene,
    EpilogueScene,
    WorldScene
  ]
};

// Initialize Phaser Game
export const game = new Phaser.Game(config);

// Setup DOM UI Event Listeners
window.addEventListener('DOMContentLoaded', () => {
  gameMaster.updateDOMHUD();

  // Act Switcher Buttons (Direct Page Teleport)
  document.querySelectorAll('.act-pill-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetScene = btn.getAttribute('data-act');
      if (targetScene) {
        sound.playCoin();
        const activeScenes = game.scene.getScenes(true);
        activeScenes.forEach(s => s.scene.stop());
        game.scene.start(targetScene);
      }
    });
  });

  // Sound Toggle
  const btnSound = document.getElementById('btn-sound');
  if (btnSound) {
    btnSound.addEventListener('click', () => {
      const active = sound.toggleMute();
      btnSound.textContent = active ? 'Sound: ON' : 'Sound: OFF';
    });
  }

  // Gifts Inventory Modal
  const btnGifts = document.getElementById('btn-gifts');
  const giftsModal = document.getElementById('gifts-modal');
  const btnCloseGifts = document.getElementById('btn-close-gifts');

  if (btnGifts && giftsModal) {
    btnGifts.addEventListener('click', () => {
      gameState.renderGiftsModal();
      giftsModal.classList.remove('hidden');
    });
  }
  if (btnCloseGifts && giftsModal) {
    btnCloseGifts.addEventListener('click', () => {
      giftsModal.classList.add('hidden');
    });
  }

  // Controls Modal
  const btnControls = document.getElementById('btn-controls');
  const controlsModal = document.getElementById('controls-modal');
  const btnCloseControls = document.getElementById('btn-close-controls');

  if (btnControls && controlsModal) {
    btnControls.addEventListener('click', () => {
      controlsModal.classList.remove('hidden');
    });
  }
  if (btnCloseControls && controlsModal) {
    btnCloseControls.addEventListener('click', () => {
      controlsModal.classList.add('hidden');
    });
  }

  // Close modals on clicking outside window
  window.addEventListener('click', (e) => {
    if (e.target === giftsModal) giftsModal?.classList.add('hidden');
    if (e.target === controlsModal) controlsModal?.classList.add('hidden');
  });
});
