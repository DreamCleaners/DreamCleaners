import { Rarity } from '../shop/rarity.ts';
import { WeaponPassiveType } from './passives/weaponPassivesManager.ts';
import { WeaponType } from './weaponType';

export interface WeaponSerializedData {
  weaponType: WeaponType;
  currentRarity: Rarity;
  embeddedPassives: WeaponPassiveType[];
}
