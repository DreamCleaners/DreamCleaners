import { Game } from '../game';
import { PlayerPassiveItem } from './playerPassiveItem';
import { PlayerPassiveType } from './playerPassiveType';
import { PoisonousMushroom } from './passives/poisonousMushroom';
import { MoldyCheese } from './passives/moldyCheese';
import { Mask } from './passives/mask';
import { PocketWatch } from './passives/pocketWatch';
import { ClownNose } from './passives/clownNose';
import { SuspiciousMixture } from './passives/suspiciousMixture';
import { TeddyBear } from './passives/teddyBear';
import { Feather } from './passives/feather';
import { UnicornHorn } from './passives/unicornHorn';
import { Clover } from './passives/clover';
import { CandyCane } from './passives/candyCane';
import { EnergizedDrink } from './passives/energizedDrink';

export class PlayerPassiveFactory {
  constructor(private game: Game) {}

  public createPlayerPassive(type: PlayerPassiveType): PlayerPassiveItem {
    switch (type) {
      case PlayerPassiveType.POISONOUS_MUSHROOM:
        return new PoisonousMushroom(this.game, type);
      case PlayerPassiveType.MOLDY_CHEESE:
        return new MoldyCheese(this.game, type);
      case PlayerPassiveType.MASK:
        return new Mask(this.game, type);
      case PlayerPassiveType.POCKET_WATCH:
        return new PocketWatch(this.game, type);
      case PlayerPassiveType.CLOWN_NOSE:
        return new ClownNose(this.game, type);
      case PlayerPassiveType.SUSPICIOUS_MIXTURE:
        return new SuspiciousMixture(this.game, type);
      case PlayerPassiveType.TEDDY_BEAR:
        return new TeddyBear(this.game, type);
      case PlayerPassiveType.FEATHER:
        return new Feather(this.game, type);
      case PlayerPassiveType.UNICORN_HORN:
        return new UnicornHorn(this.game, type);
      case PlayerPassiveType.CLOVER:
        return new Clover(this.game, type);
      case PlayerPassiveType.CANDY_CANE:
        return new CandyCane(this.game, type);
      case PlayerPassiveType.ENERGIZED_DRINK:
        return new EnergizedDrink(this.game, type);
      default:
        throw new Error(`Unknown passive type: ${type}`);
    }
  }
}
