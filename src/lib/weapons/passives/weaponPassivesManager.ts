// This singleton class manages the weapon passives.
// More precisely, it is used to store all passives instances, and is used as a hub
// to get information about the passives.
import { Rarity } from '../../shop/rarity';
import { Weapon } from '../weapon';
import { Johnny } from './tier_one/johnny';
import { LuckyShot } from './tier_one/luckyShot';
import { Snail } from './tier_one/snail';
import { Akimbo } from './tier_three/akimbo';
import { MoreBullets } from './tier_three/moreBullets';
import { Ratata } from './tier_three/ratata';
import { DontMiss } from './tier_two/dontMiss';
import { SleightOfHands } from './tier_two/sleightOfHands';
import { Vampire } from './tier_two/vampire';
import { WeaponPassive } from './weaponPassive';

// Thus, WeaponPassivesManager acts as a factory as well as a registry.
export class WeaponPassivesManager {
  private static instance: WeaponPassivesManager | null = null;

  // A map of all the passives and their instance in the game.
  private passives: Map<WeaponPassiveType, WeaponPassive> = new Map<
    WeaponPassiveType,
    WeaponPassive
  >();

  public static getInstance(): WeaponPassivesManager {
    if (this.instance === null) {
      this.instance = new WeaponPassivesManager();
    }
    return this.instance;
  }

  private constructor() {
    // We initialize all our passives and we store them in the map
    // Only put the passives here if they are implemented

    // T1
    this.passives.set(WeaponPassiveT1.LUCKY_SHOT, new LuckyShot());
    this.passives.set(WeaponPassiveT1.SNAIL, new Snail());
    this.passives.set(WeaponPassiveT1.JOHNNY, new Johnny());

    // T2
    this.passives.set(WeaponPassiveT2.VAMPIRE, new Vampire());
    this.passives.set(WeaponPassiveT2.SLEIGHT_OF_HANDS, new SleightOfHands());
    this.passives.set(WeaponPassiveT2.DONT_MISS, new DontMiss());

    // T3
    this.passives.set(WeaponPassiveT3.AKIMBO, new Akimbo());
    this.passives.set(WeaponPassiveT3.I_NEED_MORE_BULLETS, new MoreBullets());
    this.passives.set(WeaponPassiveT3.RATATA, new Ratata());
  }

  /** Returns the passive specified hard-coded name. This name can be different from
   * the enum value, meaning the user can see a more user-friendly name that the one
   * used in the code.
   */
  public getPrettyPassiveName(passiveType: WeaponPassiveType): string {
    const passive = this.passives.get(passiveType);
    if (passive) {
      return passive.name;
    } else {
      console.log('Passive not found: ', passiveType);
      return 'UNKOWN_NAME';
    }
  }

  /** Returns the passive description based on the passive type */
  public getPassiveDescription(passiveType: WeaponPassiveType): string {
    const passive = this.passives.get(passiveType);
    if (passive) {
      return passive.description;
    } else {
      console.log('Passive not found: ', passiveType);
      return 'UNKOWN_DESCRIPTION';
    }
  }

  public getPassiveRarity(passiveType: WeaponPassiveType): Rarity {
    switch (this.getQualityIndexForPassive(passiveType)) {
      case 0:
        return Rarity.COMMON;
      case 1:
        return Rarity.EPIC;
      case 2:
        return Rarity.LEGENDARY;
      default:
        console.log('Unknown passive type: ', passiveType);
        return Rarity.COMMON; // Default to common if unknown
    }
  }

  public getAllPassives(): Map<WeaponPassiveType, WeaponPassive> {
    return this.passives;
  }

  /** Applies one specified passive to the weapon */
  public applyPassiveToWeapon(weapon: Weapon, passiveType: WeaponPassiveType): void {
    const passive = this.passives.get(passiveType);
    if (passive) {
      passive.embedPassiveToWeapon(weapon);
      if (weapon.isAkimboWielding && passiveType !== WeaponPassiveT3.AKIMBO) {
        // If the weapon is akimbo, we need to apply the passive to the akimbo weapon too
        console.log('Also applying passive to akimbo weapon');
        passive.embedPassiveToWeapon(weapon.akimboWeapon!);
      }
    } else {
      console.log('Passive not found: ', passiveType);
    }
  }

  /** Applies multiple passives to a weapon in one-go. Used for example in weapon deserialization */
  public applyPassivesToWeapon(weapon: Weapon, passivesTypes: WeaponPassiveType[]): void {
    for (const passiveType of passivesTypes) {
      this.applyPassiveToWeapon(weapon, passiveType);
    }
  }

  /** Returns an index indicating the rarity/quality/power of a passive */
  public getQualityIndexForPassive(passiveType: WeaponPassiveType): number {
    // We need to check from what enum the passive is coming from
    // T1 will be 0 and T3 will be 2
    if (Object.values(WeaponPassiveT1).includes(passiveType as WeaponPassiveT1)) {
      return 0;
    } else if (Object.values(WeaponPassiveT2).includes(passiveType as WeaponPassiveT2)) {
      return 1;
    } else if (Object.values(WeaponPassiveT3).includes(passiveType as WeaponPassiveT3)) {
      return 2;
    } else {
      console.log('Unknown passive type: ', passiveType);
      return -1; // Unknown passive
    }
  }
}

// Enums ---------------

// All weapon passives in one same type
export type WeaponPassiveType = WeaponPassiveT1 | WeaponPassiveT2 | WeaponPassiveT3;

// Passives T1 only, used for stage reward determination and shop proposals
// All passives enums have a string attached, not to be confused with the pretty name
// (name field in the classes)
export enum WeaponPassiveT1 {
  LUCKY_SHOT = 'LUCKY_SHOT',
  SNAIL = 'SNAIL',
  JOHNNY = 'JOHNNY',
}

export enum WeaponPassiveT2 {
  VAMPIRE = 'VAMPIRE',
  SLEIGHT_OF_HANDS = 'SLEIGHT_OF_HANDS',
  DONT_MISS = 'DONT_MISS',
}

export enum WeaponPassiveT3 {
  AKIMBO = 'AKIMBO',
  RATATA = 'RATATA',
  I_NEED_MORE_BULLETS = 'I_NEED_MORE_BULLETS',
}
