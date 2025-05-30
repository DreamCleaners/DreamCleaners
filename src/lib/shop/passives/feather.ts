import { Game } from '../../game';
import { PlayerPassiveItem } from '../playerPassiveItem';
import { Rarity } from '../rarity';
import { ShopItemType } from '../shopItemType';
import { PlayerPassiveType } from '../playerPassiveType';

export class Feather extends PlayerPassiveItem {
  constructor(game: Game, playerPassiveType: PlayerPassiveType) {
    super(
      'Feather',
      'Increases your dodge chance by 8% and decrease your max health by 100',
      ShopItemType.PLAYER_PASSIVE,
      Rarity.RARE,
      game,
      playerPassiveType,
    );
  }

  public apply(): void {
    this.game.player.addDodgeChancePercentage(0.08);
    this.game.player.addMaxHealth(-100);
  }
}
