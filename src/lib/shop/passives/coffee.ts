import { Game } from '../../game';
import { PlayerPassiveItem } from '../playerPassiveItem';
import { Rarity } from '../rarity';
import { ShopItemType } from '../shopItemType';
import { PlayerPassiveType } from '../playerPassiveType';

export class Coffee extends PlayerPassiveItem {
  constructor(game: Game, playerPassiveType: PlayerPassiveType) {
    super(
      'Coffee',
      'Increases your speed by 5% and decreases your slide speed by 1%',
      ShopItemType.PLAYER_PASSIVE,
      Rarity.EPIC,
      game,
      playerPassiveType,
    );
  }

  public apply(): void {
    this.game.player.addSpeedPercentage(0.05);
    this.game.player.addSlideSpeedPercentage(-0.01);
  }
}
