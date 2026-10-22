import Phaser from 'phaser';
import { sound } from '../audio/SoundSynth';
import { dialogue, DialogueLine } from '../systems/DialogueDirector';

export type GameAct = 'PROLOGUE' | 'ACT_I' | 'ACT_II' | 'ACT_III' | 'ACT_IV' | 'ACT_V' | 'EPILOGUE';

export interface StoryMilestone {
  id: string;
  act: GameAct;
  title: string;
  completed: boolean;
}

export interface GiftItem {
  id: number;
  name: string;
  description: string;
  unlocked: boolean;
}

export class GameMaster extends Phaser.Events.EventEmitter {
  private static instance: GameMaster;

  // Story & World Progression
  public currentAct: GameAct = 'ACT_I';
  public currentObjective: string = 'Meet the Mascot and begin your journey';
  
  // Economy & Inventory
  public coins: number = 0;
  public targetCoins: number = 40;
  public playerHealth: number = 100;
  public maxHealth: number = 100;
  public playerShield: number = 50;
  public maxShield: number = 50;
  public goldenKeyUnlocked: boolean = false;

  // Anti-duplication tracking
  public collectedCoins: Set<string> = new Set();

  // Canonical Gift Definitions
  public gifts: GiftItem[] = [
    { id: 1, name: 'Wooden Carving of Mascot', description: 'Someone made this for the mascot before the fall.', unlocked: false },
    { id: 2, name: "Child's Drawing of Royal Guard", description: 'Shows a brave soldier standing between people and beasts.', unlocked: false },
    { id: 3, name: 'Stone Mural Fragment', description: 'Depicts Aurel holding back the darkness alone.', unlocked: false },
    { id: 4, name: 'Memory Crystal', description: 'Glows faintly with the screams of a forgotten disaster.', unlocked: false },
    { id: 5, name: "Aurel's Journal", description: 'A king’s record of his burden and silent agony.', unlocked: false },
    { id: 6, name: 'Village Lantern', description: 'Guided travelers safely home in peaceful nights.', unlocked: false },
    { id: 7, name: 'Old Map Fragment', description: 'Shows ancient hidden tunnels beneath Lumenfall.', unlocked: false },
    { id: 8, name: 'Silver Brooch', description: 'A family heirloom left behind in hasty flight.', unlocked: false },
    { id: 9, name: 'Lumenfall Herb', description: 'Fragrant petals that only bloom in sacred soil.', unlocked: false },
    { id: 10, name: 'Guardian Coin', description: 'Minted in honoring the beast who once guarded all.', unlocked: false },
    { id: 11, name: 'Ancient Relic Shard', description: 'Resonates with the golden Heart of Dawn.', unlocked: false },
    { id: 12, name: 'Royal Seal Ring', description: 'Embossed with the proud crest of the Lumenfall kings.', unlocked: false }
  ];

  // Story Milestones
  public milestones: Map<string, StoryMilestone> = new Map([
    ['mascot_met', { id: 'mascot_met', act: 'ACT_I', title: 'Hear the cries beneath the rubble', completed: false }],
    ['mascot_rescued', { id: 'mascot_rescued', act: 'ACT_I', title: 'Clear debris and free the Mascot', completed: false }],
    ['first_gift_found', { id: 'first_gift_found', act: 'ACT_I', title: 'Discover the Wooden Carving (Gift #1)', completed: false }],
    ['corrupted_lands_entered', { id: 'corrupted_lands_entered', act: 'ACT_II', title: 'Cross into the Corrupted Lands', completed: false }],
    ['mural_inspected', { id: 'mural_inspected', act: 'ACT_II', title: 'Inspect the Stone Mural of Aurel', completed: false }],
    ['guard_confronted', { id: 'guard_confronted', act: 'ACT_II', title: 'Speak with the Royal Guard at the bridge', completed: false }],
    ['sanctuary_discovered', { id: 'sanctuary_discovered', act: 'ACT_III', title: 'Enter the Forgotten Sanctuary', completed: false }],
    ['beast_defeated', { id: 'beast_defeated', act: 'ACT_III', title: 'Survive the Sanctuary Beast', completed: false }],
    ['aurel_journal_found', { id: 'aurel_journal_found', act: 'ACT_III', title: 'Read the Records of Aurel', completed: false }],
    ['gate_machine_unlocked', { id: 'gate_machine_unlocked', act: 'ACT_IV', title: 'Insert 40 coins into the Castle Gate Machine', completed: false }],
    ['king_aurel_confronted', { id: 'king_aurel_confronted', act: 'ACT_IV', title: 'Confront King Aurel in the Throne Room', completed: false }],
    ['crown_broken', { id: 'crown_broken', act: 'ACT_IV', title: 'The seal shatters and corruption unleashes', completed: false }],
    ['anchors_cleared', { id: 'anchors_cleared', act: 'ACT_V', title: 'Awaken the 3 Memory Anchors', completed: false }],
    ['heart_of_dawn_choice', { id: 'heart_of_dawn_choice', act: 'ACT_V', title: 'Make the choice: Strike or Embrace', completed: false }],
    ['epilogue_sunrise', { id: 'epilogue_sunrise', act: 'EPILOGUE', title: 'A Kingdom Without a Crown', completed: false }]
  ]);

  public giftsUnlocked: Set<number> = new Set();
  public activeAnchors: [boolean, boolean, boolean] = [false, false, false];

  private constructor() {
    super();
    this.loadSave();
  }

  public static getInstance(): GameMaster {
    if (!GameMaster.instance) {
      GameMaster.instance = new GameMaster();
    }
    return GameMaster.instance;
  }

  // -------------------------------------------------------------
  // Act Progression & Objective Management
  // -------------------------------------------------------------
  public setAct(act: GameAct, objectiveText?: string) {
    if (this.currentAct !== act) {
      console.log(`[GameMaster] Entering ${act}`);
      this.currentAct = act;
      
      // Update soundtrack
      switch (act) {
        case 'PROLOGUE': sound.playBGM('prologue'); break;
        case 'ACT_I': sound.playBGM('act1'); break;
        case 'ACT_II': sound.playBGM('act2'); break;
        case 'ACT_III': sound.playBGM('act3'); break;
        case 'ACT_IV': sound.playBGM('boss_aurel'); break;
        case 'ACT_V': sound.playBGM('boss_mascot'); break;
        case 'EPILOGUE': sound.playBGM('epilogue'); break;
      }
    }

    if (objectiveText) {
      this.currentObjective = objectiveText;
    }

    this.emit('act:changed', this.currentAct, this.currentObjective);
    this.updateDOMHUD();
    this.saveGame();
  }

  public completeMilestone(milestoneId: string): boolean {
    const ms = this.milestones.get(milestoneId);
    if (ms && !ms.completed) {
      ms.completed = true;
      console.log(`[GameMaster] Milestone completed: ${ms.title}`);
      this.emit('milestone:completed', ms);
      this.saveGame();
      return true;
    }
    return false;
  }

  public isMilestoneCompleted(milestoneId: string): boolean {
    return this.milestones.get(milestoneId)?.completed || false;
  }

  // -------------------------------------------------------------
  // Economy & Coins
  // -------------------------------------------------------------
  public addCoins(amount: number) {
    this.coins += amount;
    sound.playCoin();
    this.emit('coins:changed', this.coins);
    this.updateDOMHUD();
    this.saveGame();
  }

  public spendCoins(amount: number): boolean {
    if (this.coins >= amount) {
      this.coins -= amount;
      this.emit('coins:changed', this.coins);
      this.updateDOMHUD();
      this.saveGame();
      return true;
    }
    return false;
  }

  public isCoinCollected(coinId: string): boolean {
    return this.collectedCoins.has(coinId);
  }

  public collectCoin(coinId: string, amount: number = 1): boolean {
    if (this.collectedCoins.has(coinId)) {
      return false;
    }
    this.collectedCoins.add(coinId);
    this.addCoins(amount);
    return true;
  }

  // -------------------------------------------------------------
  // Player Health & Shield
  // -------------------------------------------------------------
  public damageShield(amount: number): number {
    if (this.playerShield > 0) {
      if (this.playerShield >= amount) {
        this.playerShield -= amount;
        sound.playShieldBlock();
        this.emit('shield:damaged', this.playerShield);
        this.updateDOMHUD();
        return 0;
      } else {
        const overflow = amount - this.playerShield;
        this.playerShield = 0;
        sound.playShieldBreak();
        this.emit('shield:broken');
        this.updateDOMHUD();
        return overflow;
      }
    }
    return amount;
  }

  public addShield(amount: number) {
    this.playerShield = Math.min(this.maxShield, this.playerShield + amount);
    sound.playShieldPickup();
    this.emit('shield:healed', this.playerShield);
    this.updateDOMHUD();
  }

  public damagePlayer(amount: number): boolean {
    const remainingDmg = this.damageShield(amount);
    if (remainingDmg <= 0) {
      return false;
    }

    this.playerHealth = Math.max(0, this.playerHealth - remainingDmg);
    sound.playHit();
    this.emit('player:damaged', this.playerHealth);
    this.updateDOMHUD();
    
    if (this.playerHealth <= 0) {
      this.emit('player:died');
      return true;
    }
    return false;
  }

  public healPlayer(amount: number) {
    this.playerHealth = Math.min(this.maxHealth, this.playerHealth + amount);
    this.playerShield = this.maxShield;
    this.emit('player:healed', this.playerHealth);
    this.updateDOMHUD();
  }

  // -------------------------------------------------------------
  // Gifts & Relics
  // -------------------------------------------------------------
  public unlockGift(id: number, name: string) {
    if (!this.giftsUnlocked.has(id)) {
      this.giftsUnlocked.add(id);
      sound.playMagicChime();
      this.emit('gift:unlocked', id, name);
      this.updateDOMHUD();
      this.saveGame();
    }
  }

  public renderGiftsModal() {
    const grid = document.getElementById('gifts-grid');
    if (!grid) return;
    grid.innerHTML = '';
    this.gifts.forEach(gift => {
      const isUnlocked = this.giftsUnlocked.has(gift.id);
      const card = document.createElement('div');
      card.className = `gift-card ${isUnlocked ? 'unlocked' : ''}`;
      card.innerHTML = `
        <div class="gift-num">Gift #${gift.id}</div>
        <div class="gift-name">${isUnlocked ? gift.name : '??? Locked'}</div>
        <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">
          ${isUnlocked ? gift.description : 'Explore Lumenfall to discover.'}
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // -------------------------------------------------------------
  // Synchronize DOM UI Overlay
  // -------------------------------------------------------------
  public updateDOMHUD() {
    // Act & Objective
    const actBadge = document.getElementById('act-badge');
    if (actBadge) actBadge.textContent = this.currentAct.replace('_', ' ');

    const objBanner = document.getElementById('objective-banner');
    if (objBanner) objBanner.textContent = this.currentObjective;

    // Coins
    const coinCounter = document.getElementById('coin-counter');
    if (coinCounter) coinCounter.textContent = this.coins.toString();

    // Health Bar
    const healthFill = document.getElementById('health-bar-fill');
    const healthTrail = document.getElementById('health-bar-trail');
    const healthVal = document.getElementById('health-value');
    if (healthFill && healthVal) {
      const pct = Math.max(0, Math.min(100, (this.playerHealth / this.maxHealth) * 100));
      healthFill.style.width = `${pct}%`;
      healthVal.textContent = Math.round(this.playerHealth).toString();

      if (healthTrail) {
        setTimeout(() => {
          healthTrail.style.width = `${pct}%`;
        }, 180);
      }

      healthFill.classList.remove('high', 'medium', 'critical');
      if (pct > 50) {
        healthFill.classList.add('high');
      } else if (pct > 25) {
        healthFill.classList.add('medium');
      } else {
        healthFill.classList.add('critical');
      }
    }

    // Shield Bar
    const shieldFill = document.getElementById('shield-bar-fill');
    const shieldVal = document.getElementById('shield-value');
    if (shieldFill && shieldVal) {
      const shieldPct = Math.max(0, Math.min(100, (this.playerShield / this.maxShield) * 100));
      shieldFill.style.width = `${shieldPct}%`;
      shieldVal.textContent = Math.round(this.playerShield).toString();
    }

    // Gifts count
    const giftCountEl = document.getElementById('gift-counter');
    if (giftCountEl) {
      giftCountEl.textContent = `${this.giftsUnlocked.size}/12`;
    }

    // Keep modal grid synced if open
    this.renderGiftsModal();
  }

  // -------------------------------------------------------------
  // LocalStorage Persistence
  // -------------------------------------------------------------
  public saveGame() {
    try {
      const data = {
        act: this.currentAct,
        objective: this.currentObjective,
        coins: this.coins,
        playerHealth: this.playerHealth,
        milestones: Array.from(this.milestones.entries()).map(([k, v]) => [k, v.completed]),
        gifts: Array.from(this.giftsUnlocked),
        anchors: this.activeAnchors,
        collectedCoins: Array.from(this.collectedCoins),
        goldenKeyUnlocked: this.goldenKeyUnlocked
      };
      localStorage.setItem('crown_dark_master_save', JSON.stringify(data));
    } catch (e) {}
  }

  public loadSave() {
    try {
      const saved = localStorage.getItem('crown_dark_master_save');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.act) this.currentAct = parsed.act;
        if (parsed.objective) this.currentObjective = parsed.objective;
        if (typeof parsed.coins === 'number') this.coins = parsed.coins;
        if (typeof parsed.playerHealth === 'number') {
          this.playerHealth = parsed.playerHealth <= 5 ? 100 : parsed.playerHealth;
        }
        this.playerShield = this.maxShield; // Always start with full shield (50/50)
        if (Array.isArray(parsed.milestones)) {
          parsed.milestones.forEach(([k, comp]: [string, boolean]) => {
            const ms = this.milestones.get(k);
            if (ms) ms.completed = comp;
          });
        }
        if (Array.isArray(parsed.gifts)) {
          this.giftsUnlocked = new Set(parsed.gifts);
        }
        if (Array.isArray(parsed.anchors)) {
          this.activeAnchors = parsed.anchors as [boolean, boolean, boolean];
        }
        if (Array.isArray(parsed.collectedCoins)) {
          this.collectedCoins = new Set(parsed.collectedCoins);
        }
        if (typeof parsed.goldenKeyUnlocked === 'boolean') {
          this.goldenKeyUnlocked = parsed.goldenKeyUnlocked;
        }
      }
    } catch (e) {}
  }
}

export const gameMaster = GameMaster.getInstance();
