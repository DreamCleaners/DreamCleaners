import { Game } from '../../game';
import { PlayerPassiveItem } from '../playerPassiveItem';
import { Rarity } from '../rarity';
import { ShopItemType } from '../shopItemType';
import { PlayerPassiveType } from '../playerPassiveType';

export class UnicornHorn extends PlayerPassiveItem {
  constructor(game: Game, playerPassiveType: PlayerPassiveType) {
    super(
      'Unicorn Horn',
      'Increases your speed by 2% and your slide speed by 2%',
      500,
      ShopItemType.PLAYER_PASSIVE,
      Rarity.RARE,
      game,
      playerPassiveType,
    );
  }

  public apply(): void {
    this.game.player.addSpeedPercentage(0.02);
    this.game.player.addSlideSpeedPercentage(0.02);
  }
}
