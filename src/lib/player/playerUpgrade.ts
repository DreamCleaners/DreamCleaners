export interface PlayerUpgrade {
  upgradeName: string;
  description: string;
  currentUpgradeIndex: number;
  unlockCost: number;
  upgradesValue: number[];
  upgradesCost: number[];
}
