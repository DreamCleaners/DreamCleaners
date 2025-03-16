import { Observable } from '@babylonjs/core';
import { Game } from '../game';
import { PlayerUpgrade } from './playerUpgrade';
import { PlayerUpgradeType } from './playerUpgradeType';
import { playerUpgrades } from '../../data/playerUpgrades';
import { ISaveable } from '../saveable';

export class PlayerUpgradeManager implements ISaveable {
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

    this.game.saveManager.save();

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

  public save(): string {
    const data: { [key: string]: number } = {};

    for (const [key, value] of playerUpgrades) {
      data[`upgrade${key}`] = value.currentUpgradeIndex;
    }

    return JSON.stringify(data);
  }

  public restoreSave(data: string): void {
    const parsedData = JSON.parse(data);

    for (const [key, value] of playerUpgrades) {
      value.currentUpgradeIndex = parsedData[`upgrade${key}`];
      if (
        value.currentUpgradeIndex === undefined ||
        value.currentUpgradeIndex === null ||
        value.currentUpgradeIndex < -1 ||
        value.currentUpgradeIndex >= value.upgradesValue.length
      ) {
        throw new Error(`Invalid upgrade index for upgrade ${key}`);
      }
    }
  }

  public resetSave(): void {
    for (const [key, value] of playerUpgrades) {
      if (key === PlayerUpgradeType.REGEN_SPEED) {
        value.currentUpgradeIndex = -1;
      } else {
        value.currentUpgradeIndex = 0;
      }
    }
  }
}
