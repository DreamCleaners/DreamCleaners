import { Game } from '../game';
import { FixedStageLayout } from './fixedStageLayout';
import { GameScene } from './gameScene';
import { SceneFactory } from './sceneFactory';

export class SceneManager {
  private currentScene: GameScene | null = null;

  constructor(private game: Game) {
    this.changeSceneToFixedStage(FixedStageLayout.HUB);
  }

  /**
   * Dispose of the current scene and load the new scene.
   */
  public async changeSceneToFixedStage(layout: FixedStageLayout): Promise<void> {
    this.game.engine.displayLoadingUI();
    if (this.currentScene !== null) {
      this.currentScene.dispose();
      this.currentScene = null;
    }

    const scene = SceneFactory.createFixedStageScene(layout, this.game);

    await scene.load();
    this.game.engine.hideLoadingUI();
    this.currentScene = scene;
  }

  public async changeSceneToProceduralStage(): Promise<void> {
    // TODO!
  }

  public update(): void {
    if (this.currentScene === null) return;
    this.currentScene.update();
  }

  public fixedUpdate(): void {
    if (this.currentScene === null) return;
    this.currentScene.fixedUpdate();
  }
}
