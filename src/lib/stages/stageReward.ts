import { Rarity } from '../shop/rarity.ts';
import { WeaponType } from '../weapons/weaponType';
import { Weapon } from '../weapons/weapon';
import { Player } from '../player/player';
import { RewardWeaponDescription } from './rewardWeaponDescription';
import {
  WeaponPassivesManager,
  WeaponPassiveT1,
  WeaponPassiveT2,
  WeaponPassiveT3,
  WeaponPassiveType,
} from '../weapons/passives/weaponPassivesManager';

/** The rewards linked to a stage */
export class StageReward {
  // Probabilities for passives in weapon
  public static readonly CHANCE_NO_PASSIVES = 0.5;
  public static readonly CHANCE_ONE_PASSIVE = 0.35;
  public static readonly CHANCE_TWO_PASSIVES = 0.15;
  public static readonly CHANCE_TIER_1 = 0.75;
  public static readonly CHANCE_TIER_2 = 0.2;
  public static readonly CHANCE_TIER_3 = 0.05;

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
    // Base reward between 400 and 700
    const baseRewardMin = 400;
    const baseRewardMax = 700;
    const steps = (baseRewardMax - baseRewardMin) / 10 + 1;
    const baseReward = baseRewardMin + Math.floor(Math.random() * steps) * 10;

    const progressionBonus = runProgression > 1 ? 200 * (runProgression - 1) : 0;

    return baseReward + progressionBonus;
  }

  private rewardContainsWeapon(): boolean {
    // 40% chance to have a weapon as reward
    return Math.random() < 0.4;
  }

  private determineWeaponReward(runProgession: number): RewardWeaponDescription {
    // We will generate random informations for the reward weapon
    // The actual weapon will be created when the stage is completed
    const weaponType = this.pickRandomWeaponType();
    const rarity = this.pickRandomRarity(runProgession);
    const embeddedPassives = this.pickRandomPassives();
    return new RewardWeaponDescription(weaponType, rarity, embeddedPassives);
  }

  private pickRandomWeaponType(): WeaponType {
    const weaponTypes = Object.values(WeaponType);
    const randomIndex = Math.floor(Math.random() * weaponTypes.length);
    return weaponTypes[randomIndex];
  }

  /** Picks a rarity for the wepaon, based on the run progress */
  private pickRandomRarity(runProgression: number): Rarity {
    const rarities = Object.values(Rarity).filter(
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
        return rarities[i] as Rarity;
      }
    }

    // Fallback to the lowest rarity in case of an error
    return rarities[0] as Rarity;
  }

  /** Picks random passives (or no passives) for the weapon reward
   * Every probabilities are defined in the class variables
   */
  private pickRandomPassives(): WeaponPassiveType[] {
    // Determine the number of passives that shall be embedded in the weapon
    const randomChance = Math.random();
    let numberOfPassives = 0;

    if (randomChance < StageReward.CHANCE_NO_PASSIVES) {
      numberOfPassives = 0; // No passives
    } else if (
      randomChance <
      StageReward.CHANCE_NO_PASSIVES + StageReward.CHANCE_ONE_PASSIVE
    ) {
      numberOfPassives = 1; // One passive
    } else {
      numberOfPassives = 2; // Two passives
    }

    if (numberOfPassives === 0) {
      return [];
    }

    const selectedPassives: Set<WeaponPassiveType> = new Set();

    // We pick random passives according to the probabilities
    // Each tier has a different chance of being selected
    while (selectedPassives.size < numberOfPassives) {
      const tierChance = Math.random();
      let passive!: WeaponPassiveType;

      if (tierChance < StageReward.CHANCE_TIER_1) {
        // Tier 1 passive
        const tier1Passives = Object.values(WeaponPassiveT1) as WeaponPassiveT1[];
        passive = tier1Passives[Math.floor(Math.random() * tier1Passives.length)];
      } else if (tierChance < StageReward.CHANCE_TIER_1 + StageReward.CHANCE_TIER_2) {
        // Tier 2 passive
        const tier2Passives = Object.values(WeaponPassiveT2) as WeaponPassiveT2[];
        passive = tier2Passives[Math.floor(Math.random() * tier2Passives.length)];
      } else {
        // Tier 3 passive
        const tier3Passives = Object.values(WeaponPassiveT3) as WeaponPassiveT3[];
        passive = tier3Passives[Math.floor(Math.random() * tier3Passives.length)];
      }

      selectedPassives.add(passive);
    }

    return Array.from(selectedPassives);
  }

  public getMoneyReward(): number {
    return this.moneyReward;
  }

  public getWeaponReward(): RewardWeaponDescription | undefined {
    return this.weaponReward;
  }

  // Weapon creation logic
  public async createWeapon(player: Player): Promise<Weapon> {
    if (!this.weaponReward) {
      throw new Error('No weapon reward to create');
    }

    const weapon = new Weapon(
      player,
      this.weaponReward.weaponType,
      this.weaponReward.rarity,
    );
    await weapon.init();
    // We also need to apply the passives to the weapon
    WeaponPassivesManager.getInstance().applyPassivesToWeapon(
      weapon,
      this.weaponReward.embeddedPassives,
    );
    return weapon;
  }
}
