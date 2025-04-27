import { Weapon } from '../../weapon';
import { WeaponPassive } from '../weaponPassive';
import { WeaponPassiveT3, WeaponPassiveType } from '../weaponPassivesManager';

export class Ratata extends WeaponPassive {
  public name: string = 'RATATA';
  private readonly RELOAD_TIME_REDUCTION: number = 0.5; // 50% less reload time
  public description: string =
    'Your weapon can now shoot automatically and its cadency ' +
    'is doubled. If the weapon is already automatic, the cadency is instead tripled.' +
    ' Additionally, the reload time is reduced by ' +
    this.RELOAD_TIME_REDUCTION * 100 +
    '%.';

  public enumName: WeaponPassiveType = WeaponPassiveT3.RATATA;

  public override embedPassiveToWeapon(weapon: Weapon): void {
    super.embedPassiveToWeapon(weapon);

    const isAutomatic = weapon.weaponData.staticStats.isAutomatic;
    const cadencyMultiplier = isAutomatic ? 3 : 2;

    weapon.weaponData.staticStats.isAutomatic = true;

    // For all rarities we improve the cadency and reload time
    for (const rarity in weapon.weaponData.globalStats) {
      const stats = weapon.weaponData.globalStats[rarity];
      stats.cadency /= cadencyMultiplier;
      stats.reloadTime *= this.RELOAD_TIME_REDUCTION;
    }
  }
}
