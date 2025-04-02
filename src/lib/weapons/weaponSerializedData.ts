import { Rarity } from '../shop/rarity.ts';
import { WeaponType } from './weaponType';

export interface WeaponSerializedData {
  weaponType: WeaponType;
  currentRarity: Rarity;
}
