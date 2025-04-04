import { Weapon } from '../../weapon';
import { WeaponPassive } from '../weaponPassive';
import { WeaponPassiveType, WeaponPassiveT2 } from '../weaponPassivesManager';

export class Vampire extends WeaponPassive {
  public name: string = 'Vampire';
  private readonly hpPerHitModifier: number = 1; // 1 hp healed per hit
  public description: string =
    'Weapon now heals you for ' + this.hpPerHitModifier + ' hp per bullet hit.';

  public enumName: WeaponPassiveType = WeaponPassiveT2.VAMPIRE;

  public override embedPassiveToWeapon(weapon: Weapon): void {
    // We apply the passive to the player's weapon by
    // modifying the weapon's hpPerHitModifier stat
    // allowing him to heal for X hp per hit
    super.embedPassiveToWeapon(weapon);
    weapon.hpPerHitModifier = this.hpPerHitModifier;
  }
}
