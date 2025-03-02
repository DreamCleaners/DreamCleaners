import { Game } from '../game';
import { GameScene } from './gameScene';
import { ExampleScene } from './exampleScene';
import { HubScene } from './hubScene';
import { SceneType } from './sceneType';

export class SceneFactory {
  public static createScene(sceneType: SceneType, game: Game): GameScene {
    switch (sceneType) {
      case SceneType.HUB:
        return new HubScene(game);
      case SceneType.EXAMPLE:
        return new ExampleScene(game);
      default:
        throw new Error('Invalid scene type');
    }
  }
}
