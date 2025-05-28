import { Game } from '../../game';
import { PlayerPassiveItem } from '../playerPassiveItem';
import { Rarity } from '../rarity';
import { ShopItemType } from '../shopItemType';
import { PlayerPassiveType } from '../playerPassiveType';

export class Mask extends PlayerPassiveItem {
  constructor(game: Game, playerPassiveType: PlayerPassiveType) {
    super(
      'Mask',
      'Increases your max health by 200 and decreases your speed by 1%',
      ShopItemType.PLAYER_PASSIVE,
      Rarity.COMMON,
      game,
      playerPassiveType,
    );
  }

  public apply(): void {
    this.game.player.addMaxHealth(200);
    this.game.player.addSpeedPercentage(-0.01);
  }
}
