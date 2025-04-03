import { WeaponPassiveType } from '../weapons/passives/weaponPassivesManager';
import { Rarity } from './rarity';
import { ShopItem } from './shopItem';
import { ShopItemType } from './shopItemType';

export class WeaponPassiveItem implements ShopItem {
  constructor(
    public name: string,
    public description: string,
    public price: number,
    public type: ShopItemType,
    public rarity: Rarity,
    public weaponPassiveType: WeaponPassiveType,
  ) {}
}
