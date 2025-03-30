import { WeaponRarity } from './weaponRarity';
import { WeaponType } from './weaponType';
import { WeaponData } from './weaponData';
import { WeaponPassiveType } from './passives/weaponPassive';

export interface WeaponSerializedData {
  weaponType: WeaponType;
  currentRarity: WeaponRarity;
  weaponData: WeaponData;
  embeddedPassives: WeaponPassiveType[];
}
