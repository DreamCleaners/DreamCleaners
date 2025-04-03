import { WeaponPassiveType } from './passives/weaponPassivesManager';
import { WeaponRarity } from './weaponRarity';
import { WeaponType } from './weaponType';

export interface WeaponSerializedData {
  weaponType: WeaponType;
  currentRarity: WeaponRarity;
  embeddedPassives: WeaponPassiveType[];
}
