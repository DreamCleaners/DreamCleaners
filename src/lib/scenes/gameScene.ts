import { Scene } from '@babylonjs/core';
import { Game } from '../game';
import { EnemyFactory } from '../enemies/enemyFactory';
import { EnemyType } from '../enemies/enemyType';

export abstract class GameScene {
  public scene: Scene;
  protected enemyManager!: EnemyFactory;

  // Difficulty factor, used to scale enemies stats and spawning
  public difficultyFactor = 1;
  // We shall only spawn enemies of these types
  public enemyTypesToSpawn: EnemyType[] = [];

  constructor(protected game: Game) {
    this.scene = game.scene;
    this.enemyManager = EnemyFactory.getInstance();
  }

  public abstract load(): Promise<void>;

  /**
   * Dispose of any resources used by the scene.
   */
  public abstract dispose(): Promise<void>;

  public update(): void {}

  public fixedUpdate(): void {}

  public setStageParameters(difficultyFactor: number, enemyTypes: EnemyType[]): void {
    this.difficultyFactor = difficultyFactor;
    this.enemyTypesToSpawn = enemyTypes;
    console.log(
      'Stage will be of difficulty: ' +
        difficultyFactor +
        ' and will spawn enemies of types: ',
      enemyTypes,
    );
  }
}
