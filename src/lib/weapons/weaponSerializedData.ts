import { WeaponRarity } from './weaponRarity';
import { WeaponType } from './weaponType';
import { WeaponData } from './weaponData';

export interface WeaponSerializedData {
  weaponType: WeaponType;
  currentRarity: WeaponRarity;
  weaponData: WeaponData;
}
