import { Scene } from '@babylonjs/core';
import { Game } from '../game';
import { EnemyFactory } from '../enemies/enemyFactory';
import { EnemyType } from '../enemies/enemyType';
import { FixedStageLayout } from './fixedStageLayout';
import { StageReward } from '../stages/stageReward';
import { GameAssetContainer } from '../assets/gameAssetContainer';

export abstract class GameScene {
  public scene: Scene;
  protected enemyFactory!: EnemyFactory;

  public gameAssetContainer!: GameAssetContainer;

  // The specificities of the stage linked to this scene

  public isStageProcedural = false;
  // The proposed stage layout, null if procedural
  public proposedFixedStageLayout: FixedStageLayout | null = null;
  public difficultyFactor = 1;
  public enemyTypesToSpawn: EnemyType[] = [];

  public stageReward: StageReward | null = null;

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
  }

  public update(): void {}

  public fixedUpdate(): void {}

  public setStageParameters(difficultyFactor: number, enemyTypes: EnemyType[]): void {
    this.difficultyFactor = difficultyFactor;
    this.enemyTypesToSpawn = enemyTypes;
  }

  public setStageReward(stageReward: StageReward | null): void {
    this.stageReward = stageReward;
  }
}
