import { Game } from '../game';
import { PlayerPassiveItem } from './playerPassiveItem';
import { MoveSpeed } from './passives/moveSpeed';
import { PlayerPassiveType } from './playerPassiveType';
import { MaxHealth } from './passives/maxHealth';

export class PlayerPassiveFactory {
  constructor(private game: Game) {}

  public createPlayerPassive(type: PlayerPassiveType): PlayerPassiveItem {
    switch (type) {
      case PlayerPassiveType.MOVE_SPEED:
        return new MoveSpeed(this.game, type);
      case PlayerPassiveType.MAX_HEALTH:
        return new MaxHealth(this.game, type);
      default:
        throw new Error(`Unknown passive type: ${type}`);
    }
  }
}
