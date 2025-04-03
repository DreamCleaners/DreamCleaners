import { Weapon } from '../../weapon';
import { WeaponPassive } from '../weaponPassive';
import { WeaponPassiveType, WeaponPassiveT2 } from '../weaponPassivesManager';

export class DontMiss extends WeaponPassive {
  public name: string = "Don't miss";
  private readonly BASE_DAMAGE_MALUS = 0.1; // 10% damage malus at 0 stacks
  private readonly MAX_STACKS = 20; // Max stacks
  private readonly DAMAGE_BONUS_PER_STACK = 0.02; // 2% damage bonus per stack
  public description: string =
    'Your weapon deals ' +
    this.BASE_DAMAGE_MALUS * 100 +
    "% less damage. However, each shot hitting an enemy increases the weapon's damage by " +
    this.DAMAGE_BONUS_PER_STACK * 100 +
    '%, up to a maximum of ' +
    this.MAX_STACKS * this.DAMAGE_BONUS_PER_STACK * 100 +
    '%. Missing a shot resets this modifier.';

  public enumName: WeaponPassiveType = WeaponPassiveT2.DONT_MISS;

  public override embedPassiveToWeapon(weapon: Weapon): void {
    super.embedPassiveToWeapon(weapon);
    // We simply set variables in the weapon that it shall use to calculate the damage
    // The damage malus however is directly set in the weapon's stats
    weapon.isDontMissPassiveActive = true;
    weapon.dontMissStackCount = 0;
    weapon.dontMissMaxStackCount = this.MAX_STACKS;
    weapon.dontMissDamageBonusPerStack = this.DAMAGE_BONUS_PER_STACK;

    // We set the base damage malus in the weapon's stats
    for (const stat of weapon.weaponData.globalStats) {
      stat.damage *= 1 - this.BASE_DAMAGE_MALUS;
    }
    weapon.applyCurrentStats();
  }
}
