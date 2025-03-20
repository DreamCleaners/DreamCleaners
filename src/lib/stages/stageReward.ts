import { WeaponRarity } from '../weapons/weaponRarity';
import { WeaponType } from '../weapons/weaponType';
import { RewardWeaponDescription } from './rewardWeaponDescription';

/** The rewards linked to a stage */
export class StageReward {
  // The stage reward is composed of money and possibly a random weapon
  private moneyReward: number = 0;

  // There is a chance that there will be a weapon as reward
  private weaponReward: RewardWeaponDescription | undefined = undefined;

  constructor() {
    // We could also rely on the stage specificites to create the reward.
    // For now we will just create a random reward
    this.moneyReward = this.determineMoneyReward();
    if (this.rewardContainsWeapon()) {
      this.weaponReward = this.determineWeaponReward();
    }
  }

  private determineMoneyReward(): number {
    // Money between 400 and 700
    return (Math.floor(Math.random() * 30) + 40) * 10;
  }

  private rewardContainsWeapon(): boolean {
    // One chance on three to have a weapon
    return Math.random() < 0.34;
  }

  private determineWeaponReward(): RewardWeaponDescription {
    // We will generate random informations for the reward weapon
    // The actual weapon will be created when the stage is completed
    const weaponType = this.pickRandomWeaponType();
    const rarity = this.pickRandomRarity();
    return new RewardWeaponDescription(weaponType, rarity);
  }

  private pickRandomWeaponType(): WeaponType {
    const weaponTypes = Object.values(WeaponType);
    const randomIndex = Math.floor(Math.random() * weaponTypes.length);
    return weaponTypes[randomIndex];
  }

  private pickRandomRarity(): WeaponRarity {
    const rarities = Object.values(WeaponRarity).filter(
      (value) => typeof value === 'number',
    ) as number[];
    const randomIndex = Math.floor(Math.random() * rarities.length);
    return rarities[randomIndex] as WeaponRarity;
  }

  public getMoneyReward(): number {
    return this.moneyReward;
  }

  public getWeaponReward(): RewardWeaponDescription | undefined {
    return this.weaponReward;
  }
}
