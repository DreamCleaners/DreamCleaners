import { Game } from '../../game';
import { PlayerPassiveItem } from '../playerPassiveItem';
import { Rarity } from '../rarity';
import { ShopItemType } from '../shopItemType';
import { PlayerPassiveType } from '../playerPassiveType';

export class MaxHealth extends PlayerPassiveItem {
  constructor(game: Game, playerPassiveType: PlayerPassiveType) {
    super(
      'Max Health',
      'Increases your max health by 50%',
      100,
      ShopItemType.PLAYER_PASSIVE,
      Rarity.COMMON,
      game,
      playerPassiveType,
    );
  }

  public apply(): void {
    this.game.player.healthController.setMaxHealth(
      this.game.player.healthController.getMaxHealth() * 1.5,
    );

    this.game.player.healthController.addHealth(
      this.game.player.healthController.getMaxHealth(),
    );
  }
}
