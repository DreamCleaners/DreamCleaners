import { Observable } from '@babylonjs/core';
import { Game } from '../game';
import { PlayerUpgrade } from './playerUpgrade';
import { PlayerUpgradeType } from './playerUpgradeType';

const playerUpgrades: Map<PlayerUpgradeType, PlayerUpgrade> = new Map();

playerUpgrades.set(PlayerUpgradeType.MAX_HEALTH, {
  upgradeName: 'Max Health',
  description: 'Increases the maximum health of the player',
  currentUpgradeIndex: 0,
  unlockCost: -1,
  upgradesValue: [1000, 1250, 1500, 1750, 2000],
  upgradesCost: [100, 150, 200, 400, 500],
});

playerUpgrades.set(PlayerUpgradeType.REGEN_SPEED, {
  upgradeName: 'Regeneration Speed',
  description: 'Increases the speed at which the player regenerates health',
  currentUpgradeIndex: -1,
  unlockCost: 100,
  upgradesValue: [2, 1.5, 1, 0.5, 0.1],
  upgradesCost: [100, 200, 400, 800, 1600],
});

playerUpgrades.set(PlayerUpgradeType.MOVEMENT_SPEED, {
  upgradeName: 'Movement Speed',
  description: 'Increases the movement speed of the player',
  currentUpgradeIndex: 0,
  unlockCost: -1,
  upgradesValue: [7, 8, 9, 10, 12],
  upgradesCost: [100, 200, 400, 800, 1600],
});

export class PlayerUpgradeManager {
  public onPlayerUpgradeChange = new Observable<PlayerUpgradeType>();
  public onPlayerUpgradeUnlock = new Observable<PlayerUpgradeType>();

  constructor(private game: Game) {}

  /**
   * Get the player upgrade object by the upgrade type
   */
  private getUpgrade(statType: PlayerUpgradeType): PlayerUpgrade {
    const playerUpgrade = playerUpgrades.get(statType);
    if (!playerUpgrade) {
      throw new Error(`Player upgrade type ${statType} not found`);
    }

    return playerUpgrade;
  }

  public getAllPlayerUpgrades(): Map<PlayerUpgradeType, PlayerUpgrade> {
    return playerUpgrades;
  }

  public getCurrentUpgradeValue(statType: PlayerUpgradeType): number {
    if (!this.isUpgradeUnlocked(statType)) {
      throw new Error(`Player upgrade ${statType} not bought yet`);
    }

    const playerUpgrade = this.getUpgrade(statType);
    return playerUpgrade.upgradesValue[playerUpgrade.currentUpgradeIndex];
  }

  /**
   * A player upgrade is unlocked if the currentUpgradeIndex is not -1
   */
  public isUpgradeUnlocked(statType: PlayerUpgradeType): boolean {
    return this.getUpgrade(statType).currentUpgradeIndex !== -1;
  }

  public upgrade(statType: PlayerUpgradeType): void {
    if (!this.isUpgradeUnlocked(statType)) {
      throw new Error(`Player upgrade ${statType} not unlocked yet`);
    }

    if (this.isMaxUpgrade(statType)) {
      throw new Error(`Player upgrade ${statType} already maxed out`);
    }

    const playerUpgrade = this.getUpgrade(statType);

    const upgradeCost = playerUpgrade.upgradesCost[playerUpgrade.currentUpgradeIndex];
    if (this.game.moneyManager.getPlayerMoney() < upgradeCost) {
      throw new Error(`Not enough money to upgrade ${statType}`);
    }

    this.game.moneyManager.removePlayerMoney(upgradeCost);
    playerUpgrade.currentUpgradeIndex++;

    this.onPlayerUpgradeChange.notifyObservers(statType);
  }

  public unlockUpgrade(statType: PlayerUpgradeType): void {
    if (this.isUpgradeUnlocked(statType)) {
      throw new Error(`Player upgrade ${statType} already unlocked`);
    }

    const playerUpgrade = this.getUpgrade(statType);

    if (this.game.moneyManager.getPlayerMoney() < playerUpgrade.unlockCost) {
      throw new Error(`Not enough money to unlock ${statType}`);
    }

    this.game.moneyManager.removePlayerMoney(playerUpgrade.unlockCost);
    playerUpgrade.currentUpgradeIndex = 0;

    this.onPlayerUpgradeUnlock.notifyObservers(statType);
  }

  public isMaxUpgrade(statType: PlayerUpgradeType): boolean {
    const playerUpgrade = this.getUpgrade(statType);
    return playerUpgrade.currentUpgradeIndex === playerUpgrade.upgradesValue.length - 1;
  }
}
