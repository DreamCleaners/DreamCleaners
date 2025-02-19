import { Scene } from '@babylonjs/core';
import { GameScene } from './gameScene';

export class SceneManager {
  private gameScene: GameScene;

  constructor(public scene: Scene) {
    this.gameScene = new GameScene(this);
    this.gameScene.load();
  }

  public update(): void {
    this.gameScene.update();
  }
}
