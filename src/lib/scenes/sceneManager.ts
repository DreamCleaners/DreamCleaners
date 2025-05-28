import { Vector3 } from '@babylonjs/core';
import { EnemyType } from '../enemies/enemyType';
import { Game } from '../game';
import { GameScene } from './gameScene';
import { SceneFactory } from './sceneFactory';
import { StageReward } from '../stages/stageReward';
import { StageInformation } from '../stages/stageInformation';
import { StageLayout } from './stageLayout';

export class SceneManager {
  private currentScene: GameScene | null = null;

  constructor(private game: Game) {}

  public start(): void {
    this.changeScene(StageLayout.HUB);
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
  public async changeScene(
    layout: StageLayout,
    difficultyFactor: number = 1,
    enemyTypes: EnemyType[] = [],
    stageReward: StageReward | null = null,
    description: string = '',
  ): Promise<void> {
    this.game.engine.displayLoadingUI();
    this.game.uiManager.setCrosshairVisibility(false);
    this.game.soundManager.playLoadingAmbience();

    if (this.currentScene !== null) {
      this.currentScene.dispose();
      this.currentScene = null;
    }

    // We reset player's position and camera direction
    this.game.player.setPosition(new Vector3(0, 1, 0));
    this.game.player.cameraManager.getCamera().setTarget(new Vector3(0, 1, 1));

    const scene = SceneFactory.createStageScene(layout, this.game);

    scene.setStageInformation(
      new StageInformation(
        layout,
        difficultyFactor,
        enemyTypes,
        stageReward as StageReward,
        description,
      ),
    );

    await scene.load();
    this.game.engine.hideLoadingUI();
    this.game.uiManager.setCrosshairVisibility(true);
    this.currentScene = scene;

    this.game.soundManager.stopLoadingAmbience();
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
