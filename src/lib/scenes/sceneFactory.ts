import { Game } from '../game';
import { GameScene } from './gameScene';
import { HubScene } from './hubScene';
import { FixedStageLayout } from './fixedStageLayout';
import { FixedStageScene } from './fixedStageScene';

export class SceneFactory {
  public static createFixedStageScene(layout: FixedStageLayout, game: Game): GameScene {
    if (layout === FixedStageLayout.HUB) {
      // HUB is a particular case of fixed scene and needs its own class
      return new HubScene(game);
    } else {
      return new FixedStageScene(game, layout);
    }
  }

  public static createProceduralStageScene(game: Game): GameScene {
    return new HubScene(game);
  }
}
