import { Game } from '../game';
import { PlayerPassiveType } from './playerPassiveType';
import { Rarity } from './rarity';
import { ShopItem } from './shopItem';
import { ShopItemType } from './shopItemType';

export abstract class PlayerPassiveItem implements ShopItem {
  constructor(
    public name: string,
    public description: string,
    public price: number,
    public type: ShopItemType,
    public rarity: Rarity,
    public game: Game,
    public playerPassiveType: PlayerPassiveType,
  ) {}

  public abstract apply(): void;
}
