import { gameMaster, GiftItem } from '../core/GameMaster';

export type { GiftItem };

/**
 * GameStateManager — Unified adapter delegating directly to authoritative GameMaster singleton.
 * Prevents dual-source-of-truth bugs and ensures 100% synchronization across DOM, HUD, and scenes.
 */
export class GameStateManager {
  public get health(): number { return gameMaster.playerHealth; }
  public set health(v: number) { gameMaster.playerHealth = v; }

  public get maxHealth(): number { return gameMaster.maxHealth; }
  public set maxHealth(v: number) { gameMaster.maxHealth = v; }

  public get shield(): number { return gameMaster.playerShield; }
  public set shield(v: number) { gameMaster.playerShield = v; }

  public get maxShield(): number { return gameMaster.maxShield; }
  public set maxShield(v: number) { gameMaster.maxShield = v; }

  public get coins(): number { return gameMaster.coins; }
  public set coins(v: number) { gameMaster.coins = v; }

  public get targetCoins(): number { return gameMaster.targetCoins; }
  public set targetCoins(v: number) { gameMaster.targetCoins = v; }

  public get currentAct(): string { return gameMaster.currentAct; }
  public set currentAct(v: string) { gameMaster.currentAct = v as any; }

  public get currentObjective(): string { return gameMaster.currentObjective; }
  public set currentObjective(v: string) { gameMaster.currentObjective = v; }

  public get hasRescuedMascot(): boolean { return gameMaster.isMilestoneCompleted('mascot_rescued'); }
  public set hasRescuedMascot(v: boolean) { if (v) gameMaster.completeMilestone('mascot_rescued'); }

  public get goldenKeyAcquired(): boolean { return gameMaster.goldenKeyUnlocked; }
  public set goldenKeyAcquired(v: boolean) { gameMaster.goldenKeyUnlocked = v; }

  public get castleGateOpened(): boolean { return gameMaster.isMilestoneCompleted('gate_machine_unlocked'); }
  public set castleGateOpened(v: boolean) { if (v) gameMaster.completeMilestone('gate_machine_unlocked'); }

  public get aurelDefeated(): boolean { return gameMaster.isMilestoneCompleted('king_aurel_confronted'); }
  public set aurelDefeated(v: boolean) { if (v) gameMaster.completeMilestone('king_aurel_confronted'); }

  public get crownBroken(): boolean { return gameMaster.isMilestoneCompleted('crown_broken'); }
  public set crownBroken(v: boolean) { if (v) gameMaster.completeMilestone('crown_broken'); }

  public get heartOfDawnAcquired(): boolean { return gameMaster.isMilestoneCompleted('heart_of_dawn_choice'); }
  public set heartOfDawnAcquired(v: boolean) { if (v) gameMaster.completeMilestone('heart_of_dawn_choice'); }

  public get anchorsActive(): boolean[] { return gameMaster.activeAnchors; }
  public set anchorsActive(v: boolean[]) {
    gameMaster.activeAnchors = [!!v[0], !!v[1], !!v[2]];
  }

  public get mascotSaved(): boolean { return gameMaster.isMilestoneCompleted('epilogue_sunrise'); }
  public set mascotSaved(v: boolean) { if (v) gameMaster.completeMilestone('epilogue_sunrise'); }

  public get gifts(): GiftItem[] {
    return gameMaster.gifts.map(g => ({
      ...g,
      unlocked: gameMaster.giftsUnlocked.has(g.id)
    }));
  }

  public addCoins(amount: number) {
    gameMaster.addCoins(amount);
  }

  public takeDamage(amount: number): boolean {
    return gameMaster.damagePlayer(amount);
  }

  public heal(amount: number) {
    gameMaster.healPlayer(amount);
  }

  public unlockGift(id: number): string {
    const gift = gameMaster.gifts.find(g => g.id === id);
    if (gift) {
      gameMaster.unlockGift(id, gift.name);
      return gift.name;
    }
    return '';
  }

  public setObjective(act: string, text: string) {
    gameMaster.setAct(act as any, text);
  }

  public updateHUD() {
    gameMaster.updateDOMHUD();
  }

  public renderGiftsModal() {
    gameMaster.renderGiftsModal();
  }

  public save() {
    gameMaster.saveGame();
  }

  public load() {
    gameMaster.loadSave();
  }
}

export const gameState = new GameStateManager();
