import { Scene } from '@babylonjs/core';
import { Game } from '../game';
import { EnemyFactory } from '../enemies/enemyFactory';
import { EnemyType } from '../enemies/enemyType';
import { GameAssetContainer } from '../assets/gameAssetContainer';

export abstract class GameScene {
  public scene: Scene;
  protected enemyFactory!: EnemyFactory;

  public gameAssetContainer!: GameAssetContainer;

  // Difficulty factor, used to scale enemies stats and spawning
  public difficultyFactor = 1;
  // We shall only spawn enemies of these types
  public enemyTypesToSpawn: EnemyType[] = [];

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
}
