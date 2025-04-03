import { Rarity } from './rarity';
import { ShopItemType } from './shopItemType';

export interface ShopItem {
  name: string;
  description: string;
  price: number;
  type: ShopItemType;
  rarity: Rarity;
}
