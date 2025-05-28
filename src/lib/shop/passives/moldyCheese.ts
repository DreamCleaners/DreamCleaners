import { Game } from '../../game';
import { PlayerPassiveItem } from '../playerPassiveItem';
import { Rarity } from '../rarity';
import { ShopItemType } from '../shopItemType';
import { PlayerPassiveType } from '../playerPassiveType';

export class MoldyCheese extends PlayerPassiveItem {
  constructor(game: Game, playerPassiveType: PlayerPassiveType) {
    super(
      'Moldy Cheese',
      'Increases your chance by 3% and decreases your max health by 100',
      ShopItemType.PLAYER_PASSIVE,
      Rarity.COMMON,
      game,
      playerPassiveType,
    );
  }

  public apply(): void {
    this.game.shopManager.addChancePercentageIncrease(0.03);
    this.game.player.addMaxHealth(-100);
  }
}
