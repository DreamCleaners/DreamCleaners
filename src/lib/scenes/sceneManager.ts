import { Game } from '../game';
import { GameScene } from './gameScene';
import { SceneFactory } from './sceneFactory';
import { SceneType } from './sceneType';

export class SceneManager {
  private currentScene: GameScene | null = null;
  private sceneCache: Map<SceneType, GameScene> = new Map();

  constructor(private game: Game) {
    this.changeScene(SceneType.HUB);
  }

  /**
   * Dispose of the current scene and load the new scene.
   */
  public async changeScene(sceneType: SceneType): Promise<void> {
    console.log(`Changing scene to ${sceneType}`);
    this.game.engine.displayLoadingUI();

    if (this.currentScene !== null) {
      this.currentScene.dispose();
      this.currentScene = null;
    }

    let scene = this.sceneCache.get(sceneType);
    if (scene === undefined) {
      scene = SceneFactory.createScene(sceneType, this.game);
      this.sceneCache.set(sceneType, scene);
    }

    await scene.load();
    this.game.engine.hideLoadingUI();
    this.currentScene = scene;
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
