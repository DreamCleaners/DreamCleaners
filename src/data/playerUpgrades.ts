import { PlayerUpgrade } from '../lib/player/playerUpgrade';
import { PlayerUpgradeType } from '../lib/player/playerUpgradeType';

export const playerUpgrades: Map<PlayerUpgradeType, PlayerUpgrade> = new Map();

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
  upgradesValue: [9, 9.25, 9.5, 9.75, 10],
  upgradesCost: [100, 200, 400, 800, 1600],
});
