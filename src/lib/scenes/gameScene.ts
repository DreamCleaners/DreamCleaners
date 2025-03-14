import { Scene } from '@babylonjs/core';
import { Game } from '../game';
import { EnemyFactory } from '../enemies/enemyFactory';

export abstract class GameScene {
  public scene: Scene;
  protected enemyManager!: EnemyFactory;

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
}
