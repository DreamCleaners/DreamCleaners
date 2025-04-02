import { WeaponPassiveType } from './passives/passivesManager';
import { WeaponRarity } from './weaponRarity';
import { WeaponType } from './weaponType';

export interface WeaponSerializedData {
  weaponType: WeaponType;
  currentRarity: WeaponRarity;
  embeddedPassives: WeaponPassiveType[];
}
