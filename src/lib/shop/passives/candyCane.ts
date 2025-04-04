import { Game } from '../../game';
import { PlayerPassiveItem } from '../playerPassiveItem';
import { Rarity } from '../rarity';
import { ShopItemType } from '../shopItemType';
import { PlayerPassiveType } from '../playerPassiveType';

export class CandyCane extends PlayerPassiveItem {
  constructor(game: Game, playerPassiveType: PlayerPassiveType) {
    super(
      'Candy Cane',
      'Increases your max health by 600 and decreases your chance by 2%',
      1000,
      ShopItemType.PLAYER_PASSIVE,
      Rarity.EPIC,
      game,
      playerPassiveType,
    );
  }

  public apply(): void {
    this.game.player.addMaxHealth(600);
    this.game.shopManager.addChancePercentageIncrease(-0.02);
  }
}
