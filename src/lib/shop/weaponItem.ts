import { WeaponType } from '../weapons/weaponType';
import { Rarity } from './rarity';
import { ShopItem } from './shopItem';
import { ShopItemType } from './shopItemType';

export class WeaponItem implements ShopItem {
  constructor(
    public name: string,
    public description: string,
    public price: number,
    public type: ShopItemType,
    public rarity: Rarity,
    public weaponType: WeaponType,
  ) {}
}
