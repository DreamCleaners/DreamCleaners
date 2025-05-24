import data from '../../assets/data/weapons.json' assert { type: 'json' };
import { WeaponData } from './weaponData';
import { WeaponJson } from './weaponJson';
import { WeaponType } from './weaponType';

export class weaponDataManager {
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
        shopDescription: weaponJson.shopDescription,
        crosshair: weaponJson.crosshair,
        globalStats: globalStats,
        staticStats: weaponJson.staticStats,
        transform: weaponJson.transform,
        firePoint: weaponJson.firePoint,
        animationsSpeed: weaponJson.animationsSpeed,
      };

      this.weaponsData.set(weaponType as WeaponType, weaponData);
    }
  }

  public getWeaponsData(): Map<WeaponType, WeaponData> {
    return this.weaponsData;
  }

  public getWeaponData(weaponType: WeaponType, isAkimboWeapon = false): WeaponData {
    const weaponData = this.weaponsData.get(weaponType);
    if (!weaponData) {
      throw new Error(`Weapon type ${weaponType} not found`);
    }

    // Create a deep copy of the weapon data
    const weaponDataCopy = structuredClone(weaponData);

    if (isAkimboWeapon) {
      const originalWeaponJson = data[weaponType as keyof typeof data] as WeaponJson;

      if (originalWeaponJson.akimboTransform) {
        // We somehow need a structureClone otherwise we keep a reference,
        // messing with the data
        weaponDataCopy.transform = structuredClone(originalWeaponJson.akimboTransform);
      }

      if (originalWeaponJson.akimboFirePoint) {
        weaponDataCopy.firePoint = structuredClone(originalWeaponJson.akimboFirePoint);
      }
    }

    return weaponDataCopy;
  }
}
