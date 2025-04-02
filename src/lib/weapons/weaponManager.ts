import data from '../../data/weapons.json' assert { type: 'json' };
import { WeaponData } from './weaponData';
import { WeaponJson } from './weaponJson';
import { WeaponType } from './weaponType';

export class weaponManager {
  private weaponsData = new Map<WeaponType, WeaponData>();

  constructor() {
    const weaponsJson = data as Record<WeaponType, WeaponJson>;
    for (const weaponType in weaponsJson) {
      const weaponJson = weaponsJson[weaponType as WeaponType];
      const globalStats = [];

      for (let i = 0; i < weaponJson.globalStats.damage.length; i++) {
        globalStats.push({
          damage: weaponJson.globalStats.damage[i],
          reloadTime: weaponJson.globalStats.reloadTime[i],
          cadency: weaponJson.globalStats.cadency[i],
          range: weaponJson.globalStats.range[i],
          magazineSize: weaponJson.globalStats.magazineSize[i],
        });
      }

      const weaponData = {
        weaponName: weaponJson.weaponName,
        globalStats: globalStats,
        staticStats: weaponJson.staticStats,
        transform: weaponJson.transform,
        firePoint: weaponJson.firePoint,
      };

      this.weaponsData.set(weaponType as WeaponType, weaponData);
    }
  }

  public getWeaponsData(): Map<WeaponType, WeaponData> {
    return this.weaponsData;
  }

  public getWeaponData(weaponType: WeaponType): WeaponData {
    const weaponData = this.weaponsData.get(weaponType);
    if (!weaponData) {
      throw new Error(`Weapon type ${weaponType} not found`);
    }

    return weaponData;
  }
}
