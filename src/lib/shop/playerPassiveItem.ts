import { Game } from '../game';
import { PlayerPassiveType } from './playerPassiveType';
import { Rarity } from './rarity';
import { ShopItem } from './shopItem';
import { ShopItemType } from './shopItemType';

export abstract class PlayerPassiveItem implements ShopItem {
  public price!: number;
  constructor(
    public name: string,
    public description: string,
    public type: ShopItemType,
    public rarity: Rarity,
    public game: Game,
    public playerPassiveType: PlayerPassiveType,
  ) {
    this.price = this.getPriceForItem(rarity);
  }

  public abstract apply(): void;

  protected getPriceForItem(r: Rarity): number {
    switch (r) {
      case Rarity.COMMON:
        return 75;
      case Rarity.RARE:
        return 150;
      case Rarity.EPIC:
        return 225;
      case Rarity.LEGENDARY:
      default:
        return -1;
    }
  }
}
