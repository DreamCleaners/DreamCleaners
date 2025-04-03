import { Weapon } from '../../weapon';
import { WeaponPassiveT1, WeaponPassiveType } from '../weaponPassivesManager';
import { WeaponPassive } from '../weaponPassive';

export class LuckyShot extends WeaponPassive {
  public name: string = 'Lucky Shot';
  private readonly CRIT_CHANCE: number = 0.1;
  public description: string =
    this.CRIT_CHANCE * 100 + '% chance per bullet to deal double damage. ';
  public enumName: WeaponPassiveType = WeaponPassiveT1.LUCKY_SHOT;

  public override embedPassiveToWeapon(weapon: Weapon): void {
    // We apply the passive to the player's weapon by modifying the weapon's crit chance modifier
    super.embedPassiveToWeapon(weapon);
    weapon.critChanceModifier = this.CRIT_CHANCE;
    console.log('Applying ', this.name, ' to weapon ', weapon.weaponType);
    console.log('Description: ', this.description);
  }
}
