import { Game } from '../../game';
import { PlayerPassiveItem } from '../playerPassiveItem';
import { Rarity } from '../rarity';
import { ShopItemType } from '../shopItemType';
import { PlayerPassiveType } from '../playerPassiveType';

export class Clover extends PlayerPassiveItem {
  constructor(game: Game, playerPassiveType: PlayerPassiveType) {
    super(
      'Clover',
      'Increases your chance by 8% and decreases your speed by 2%',
      1000,
      ShopItemType.PLAYER_PASSIVE,
      Rarity.EPIC,
      game,
      playerPassiveType,
    );
  }

  public apply(): void {
    this.game.shopManager.addChancePercentageIncrease(0.08);
    this.game.player.addSpeedPercentage(-0.02);
  }
}
