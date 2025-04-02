import { WeaponRarity } from './weaponRarity';
import { WeaponType } from './weaponType';
import { WeaponPassiveType } from './passives/weaponPassive';

export interface WeaponSerializedData {
  weaponType: WeaponType;
  currentRarity: WeaponRarity;
  embeddedPassives: WeaponPassiveType[];
}
