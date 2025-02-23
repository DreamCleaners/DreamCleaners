import { GameScene } from './gameScene';
import { Game } from './game';

export class SceneManager {
  private gameScene: GameScene;

  constructor(game: Game) {
    this.gameScene = new GameScene(game);
    this.gameScene.load();
  }

  public update(): void {
    if (!this.gameScene.isLoaded) return;
    this.gameScene.update();
  }
}
