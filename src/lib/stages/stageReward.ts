import { WeaponRarity } from '../weapons/weaponRarity';
import { WeaponType } from '../weapons/weaponType';
import { Weapon } from '../weapons/weapon';
import { Player } from '../player/player';
import { RewardWeaponDescription } from './rewardWeaponDescription';

/** The rewards linked to a stage */
export class StageReward {
  // The stage reward is composed of money and possibly a random weapon
  private moneyReward: number = 0;

  // There is a chance that there will be a weapon as reward
  private weaponReward: RewardWeaponDescription | undefined = undefined;

  constructor(runProgression: number) {
    // We could also rely on the stage specificites to create the reward.
    // For now we will just create a random reward
    if (this.rewardContainsWeapon()) {
      this.weaponReward = this.determineWeaponReward(runProgression);
    }
    this.moneyReward = this.determineMoneyReward(runProgression);
  }

  private determineMoneyReward(runProgression: number): number {
    if (this.weaponReward === undefined) {
      // No weapon reward, slightly more money
      // Between 600 and 800 base + the modifier.s
      return (Math.floor(Math.random() * 20) + 60) * 10 + runProgression * 150;
    }
    // Money between 400 and 600 + the modifier.s
    return (Math.floor(Math.random() * 20) + 40) * 10 + runProgression * 150;
  }

  private rewardContainsWeapon(): boolean {
    // One chance on three to have a weapon
    return Math.random() < 0.34;
  }

  private determineWeaponReward(runProgession: number): RewardWeaponDescription {
    // We will generate random informations for the reward weapon
    // The actual weapon will be created when the stage is completed
    const weaponType = this.pickRandomWeaponType();
    const rarity = this.pickRandomRarity(runProgession);
    return new RewardWeaponDescription(weaponType, rarity);
  }

  private pickRandomWeaponType(): WeaponType {
    const weaponTypes = Object.values(WeaponType);
    const randomIndex = Math.floor(Math.random() * weaponTypes.length);
    return weaponTypes[randomIndex];
  }

  /** Picks a rarity for the wepaon, based on the run progress */
  private pickRandomRarity(runProgression: number): WeaponRarity {
    const rarities = Object.values(WeaponRarity).filter(
      (value) => typeof value === 'number',
    ) as number[];

    // Create weighted probabilities based on runProgression using a sigmoid function
    const weights = rarities.map((rarity) => {
      // Various factors for the sigmoid function
      const scalingFactor = 5 * rarity; // Adjust this value to control the transition
      const x = runProgression - scalingFactor;
      const baseWeight = 1 / (1 + Math.exp(-x / 2)); // Sigmoid function
      const biasMultiplier = Math.pow(5, rarity); // Bias multiplier for higher rarities
      return baseWeight * biasMultiplier;
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    const randomValue = Math.random() * totalWeight;

    let cumulativeWeight = 0;
    for (let i = 0; i < rarities.length; i++) {
      cumulativeWeight += weights[i];
      if (randomValue < cumulativeWeight) {
        return rarities[i] as WeaponRarity;
      }
    }

    // Fallback to the lowest rarity in case of an error
    return rarities[0] as WeaponRarity;
  }

  public getMoneyReward(): number {
    return this.moneyReward;
  }

  public getWeaponReward(): RewardWeaponDescription | undefined {
    return this.weaponReward;
  }

  // Weapon creation logic

  public createWeapon(player: Player): Weapon {
    if (!this.weaponReward) {
      throw new Error('No weapon reward to create');
    }

    const weapon = new Weapon(
      player,
      this.weaponReward.weaponType,
      this.weaponReward.rarity,
    );
    return weapon;
  }

  /*
  public debugRarityWeights(): void {
    for (let runProgression = 0; runProgression <= 10; runProgression++) {
      console.log(`Run Progression: ${runProgression}`);
      
      const rarities = Object.values(WeaponRarity).filter(
        (value) => typeof value === 'number',
      ) as number[];
  
      // Create weighted probabilities based on runProgression using a sigmoid function
      const weights = rarities.map((rarity) => {
        // Various factors for the sigmoid function
        const scalingFactor = 5 * rarity; // Adjust this value to control the transition
        const x = runProgression - scalingFactor;
        const baseWeight = 1 / (1 + Math.exp(-x / 2)); // Sigmoid function
        const biasMultiplier = Math.pow(5, rarity); // Bias multiplier for higher rarities
        return baseWeight * biasMultiplier;
      });
  
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
      // Normalize weights to ensure they sum to 100
      const normalizedWeights = weights.map((weight) => (weight / totalWeight) * 100);
  
      // Log the weights and their corresponding probabilities
      console.log(
        'Rarity Weights:',
        rarities.map((rarity, index) => ({
          rarity,
          weight: normalizedWeights[index],
          chance: normalizedWeights[index].toFixed(2) + '%',
        }))
      );
    }
  }
    */
}
