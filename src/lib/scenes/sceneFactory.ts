import { Game } from '../game';
import { GameScene } from './gameScene';
import { HubScene } from './hubScene';
import { StageLayout } from './stageLayout';
import { StageScene } from './stageScene';

export class SceneFactory {
  public static createStageScene(layout: StageLayout, game: Game): GameScene {
    if (layout === StageLayout.HUB) {
      // HUB is a particular stage scene and needs its own class
      return new HubScene(game, layout);
    } else {
      return new StageScene(game, layout);
    }
  }
}
