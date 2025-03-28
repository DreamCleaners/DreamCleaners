import { Vector3 } from '@babylonjs/core';
import { EnemyType } from '../enemies/enemyType';
import { Game } from '../game';
import { FixedStageLayout } from './fixedStageLayout';
import { GameScene } from './gameScene';
import { SceneFactory } from './sceneFactory';
import { StageReward } from '../stages/stageReward';

export class SceneManager {
  private currentScene: GameScene | null = null;

  constructor(private game: Game) {}

  public start(): void {
    this.changeSceneToFixedStage(FixedStageLayout.HUB);
  }

  public stop(): void {
    if (this.currentScene !== null) {
      this.currentScene.dispose();
      this.currentScene = null;
    }
  }

  /**
   * Dispose of the current scene and load the new scene.
   */
  public async changeSceneToFixedStage(
    layout: FixedStageLayout,
    difficultyFactor: number = 1,
    enemyTypes: EnemyType[] = [],
    stageReward: StageReward | null = null,
  ): Promise<void> {
    this.game.engine.displayLoadingUI();
    if (this.currentScene !== null) {
      this.currentScene.dispose();
      this.currentScene = null;
    }

    // We reset player's position and camera direction
    this.game.player.setPosition(new Vector3(0, 1, 0));
    this.game.player.cameraManager.getCamera().setTarget(new Vector3(0, 1, 1));

    const scene = SceneFactory.createFixedStageScene(layout, this.game);
    scene.setStageParameters(difficultyFactor, enemyTypes);
    scene.setStageReward(stageReward);

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

  public getCurrentScene(): GameScene | null {
    return this.currentScene;
  }
}
