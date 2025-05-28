import { Game } from '../../game';
import { PlayerPassiveItem } from '../playerPassiveItem';
import { Rarity } from '../rarity';
import { ShopItemType } from '../shopItemType';
import { PlayerPassiveType } from '../playerPassiveType';

export class PlasticDuck extends PlayerPassiveItem {
  constructor(game: Game, playerPassiveType: PlayerPassiveType) {
    super(
      'Plastic Duck',
      'Increases your max health by 200 and your regeneration speed by 3%',
      ShopItemType.PLAYER_PASSIVE,
      Rarity.RARE,
      game,
      playerPassiveType,
    );
  }

  public apply(): void {
    this.game.player.addMaxHealth(200);
    this.game.player.addRegenSpeedPercentage(0.03);
  }
}
