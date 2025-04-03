// This singleton class manages the weapon passives.
// More precisely, it is used to store all passives instances, and is used as a hub
// to get information about the passives.
import { Weapon } from '../weapon';
import { Johnny } from './tier_one/johnny';
import { LuckyShot } from './tier_one/luckyShot';
import { Snail } from './tier_one/snail';
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
    this.passives.set(WeaponPassiveT1.LUCKY_SHOT, new LuckyShot());
    this.passives.set(WeaponPassiveT1.SNAIL, new Snail());
    this.passives.set(WeaponPassiveT1.JOHNNY, new Johnny());

    // ... add more passives here
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

  public getAllPassives(): Map<WeaponPassiveType, WeaponPassive> {
    return this.passives;
  }

  /** Applies one specified passive to the weapon */
  public applyPassiveToWeapon(weapon: Weapon, passiveType: WeaponPassiveType): void {
    const passive = this.passives.get(passiveType);
    if (passive) {
      passive.embedPassiveToWeapon(weapon);
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
  EXEMPLE_T2 = 'EXEMPLE_T2',
}

export enum WeaponPassiveT3 {
  EXEMPLE_T3 = 'EXEMPLE_T3',
}
