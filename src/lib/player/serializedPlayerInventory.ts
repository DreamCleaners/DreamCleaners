import { PlayerPassiveType } from '../shop/playerPassiveType';
import { WeaponSerializedData } from '../weapons/weaponSerializedData';

export type SerializedPlayerInventory = {
  weapons: WeaponSerializedData[];
  playerPassives: PlayerPassiveType[];
};
