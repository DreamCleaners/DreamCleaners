// This singleton class manages the weapon passives.
// More precisely, it is used to store all passives instances, and is used as a hub
// to get information about the passives.
import { Weapon } from '../weapon';
import { LuckyShot } from './tier_one/luckyShot';
import { WeaponPassive, WeaponPassiveType } from './weaponPassive';

// Thus, PassivesManager acts as a factory as well as a registry.
export class PassivesManager {
  private static instance: PassivesManager | null = null;

  // A map of all the passives and their instance in the game.
  private passives: Map<WeaponPassiveType, WeaponPassive> = new Map<
    WeaponPassiveType,
    WeaponPassive
  >();

  public static getInstance(): PassivesManager {
    if (this.instance === null) {
      this.instance = new PassivesManager();
    }
    return this.instance;
  }

  private constructor() {
    // We initialize all our passives and we store them in the map
    this.passives.set(WeaponPassiveType.LUCKY_SHOT, new LuckyShot());

    // ... add more passives here
  }

  /** Returns the passive name in String based on the enum value */
  public getPassiveName(passiveType: WeaponPassiveType): string {
    const passive = this.passives.get(passiveType);
    if (passive) {
      return passive.name;
    } else {
      console.log('Passive not found: ', passiveType);
      return 'Passive not found';
    }
  }

  /** Returns the passive description based on the passive type */
  public getPassiveDescription(passiveType: WeaponPassiveType): string {
    const passive = this.passives.get(passiveType);
    if (passive) {
      return passive.description;
    } else {
      console.log('Passive not found: ', passiveType);
      return 'Passive not found';
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
    console.log('Applying multiple passives to weapon: ', weapon.weaponType);
    for (const passiveType of passivesTypes) {
      this.applyPassiveToWeapon(weapon, passiveType);
    }
  }
}
