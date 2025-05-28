import { Game } from '../../game';
import { PlayerPassiveItem } from '../playerPassiveItem';
import { Rarity } from '../rarity';
import { ShopItemType } from '../shopItemType';
import { PlayerPassiveType } from '../playerPassiveType';

export class PocketWatch extends PlayerPassiveItem {
  constructor(game: Game, playerPassiveType: PlayerPassiveType) {
    super(
      'Pocket Watch',
      'Increases your dodge chance by 3% and decreases your regen speed by 1%',
      ShopItemType.PLAYER_PASSIVE,
      Rarity.COMMON,
      game,
      playerPassiveType,
    );
  }

  public apply(): void {
    this.game.player.addRegenSpeedPercentage(-0.01);
    this.game.player.addDodgeChancePercentage(0.03);
  }
}
