import { Game } from '../../game';
import { PlayerPassiveItem } from '../playerPassiveItem';
import { Rarity } from '../rarity';
import { ShopItemType } from '../shopItemType';
import { PlayerPassiveType } from '../playerPassiveType';

export class PoisonousMushroom extends PlayerPassiveItem {
  constructor(game: Game, playerPassiveType: PlayerPassiveType) {
    super(
      'Poisonous Mushroom',
      'Increases your regeneration speed by 3% and decreases your chance by 1%',
      250,
      ShopItemType.PLAYER_PASSIVE,
      Rarity.COMMON,
      game,
      playerPassiveType,
    );
  }

  public apply(): void {
    this.game.player.addRegenSpeedPercentage(0.03);
    this.game.shopManager.addChancePercentageIncrease(-0.01);
  }
}
