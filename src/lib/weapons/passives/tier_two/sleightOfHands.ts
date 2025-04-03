import { Weapon } from '../../weapon';
import { WeaponPassive } from '../weaponPassive';
import { WeaponPassiveType, WeaponPassiveT2 } from '../weaponPassivesManager';

export class SleightOfHands extends WeaponPassive {
  public name: string = 'Sleight of Hands';
  private readonly RELOAD_SPEED_MODIFIER: number = 2; // 2x faster reload speed
  public description: string = 'You reload this weapon twice as fast.';

  public enumName: WeaponPassiveType = WeaponPassiveT2.SLEIGHT_OF_HANDS;

  public override embedPassiveToWeapon(weapon: Weapon): void {
    super.embedPassiveToWeapon(weapon);
    // We will change the reload speed of the weapon
    // For that we must change the stat in all GlobalStats of weapondata
    for (const stat of weapon.weaponData.globalStats) {
      stat.reloadTime /= this.RELOAD_SPEED_MODIFIER; // 2x faster reload speed
    }
    weapon.applyCurrentStats();
  }
}
