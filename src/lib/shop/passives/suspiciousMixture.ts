import { Game } from '../../game';
import { PlayerPassiveItem } from '../playerPassiveItem';
import { Rarity } from '../rarity';
import { ShopItemType } from '../shopItemType';
import { PlayerPassiveType } from '../playerPassiveType';

export class SuspiciousMixture extends PlayerPassiveItem {
  constructor(game: Game, playerPassiveType: PlayerPassiveType) {
    super(
      'Suspicious Mixture',
      'Increases your slide speed by 5% and decreases your dodge chance by 1%',
      ShopItemType.PLAYER_PASSIVE,
      Rarity.COMMON,
      game,
      playerPassiveType,
    );
  }

  public apply(): void {
    this.game.player.addDodgeChancePercentage(-0.01);
    this.game.player.addSlideSpeedPercentage(0.05);
  }
}
