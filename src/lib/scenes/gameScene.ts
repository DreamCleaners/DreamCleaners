import { Scene } from '@babylonjs/core';
import { Game } from '../game';

export abstract class GameScene {
  protected scene: Scene;

  constructor(protected game: Game) {
    this.scene = game.scene;
  }

  public abstract load(): Promise<void>;

  /**
   * Dispose of any resources used by the scene.
   */
  public abstract dispose(): Promise<void>;

  public update(): void {}

  public fixedUpdate(): void {}
}
