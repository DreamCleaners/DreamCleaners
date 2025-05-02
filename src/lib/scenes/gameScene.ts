import { Scene } from '@babylonjs/core';
import { Game } from '../game';
import { EnemyFactory } from '../enemies/enemyFactory';
import { GameAssetContainer } from '../assets/gameAssetContainer';
import { NavigationManager } from '../navigationManager';
import { StageInformation } from '../stages/stageInformation';

export abstract class GameScene {
  public scene: Scene;
  public navigationManager!: NavigationManager;
  protected enemyFactory!: EnemyFactory;

  public gameAssetContainer!: GameAssetContainer;

  // The specificities of the stage linked to this scene
  public stageInfo!: StageInformation;

  constructor(public game: Game) {
    this.scene = game.scene;
    this.enemyFactory = EnemyFactory.getInstance();
  }

  public abstract load(): Promise<void>;

  /**
   * Dispose of any resources used by the scene.
   */
  public dispose(): void {
    this.gameAssetContainer.dispose();
    this.navigationManager.dispose();
  }

  public update(): void {}

  public fixedUpdate(): void {}

  public setStageInformation(stageInfo: StageInformation): void {
    this.stageInfo = stageInfo;
  }
}
