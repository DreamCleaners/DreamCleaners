import {
  HemisphericLight,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  Scene,
  Vector3,
} from '@babylonjs/core';
import { SceneManager } from './sceneManager';

export class GameScene {
  private scene: Scene;

  constructor(protected sceneManager: SceneManager) {
    this.scene = sceneManager.scene;
  }

  public load(): void {
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;
    const ground = MeshBuilder.CreateGround(
      'ground',
      { width: 30, height: 30 },
      this.scene,
    );
    new PhysicsAggregate(ground, PhysicsShapeType.BOX, {
      mass: 0,
    });
  }

  public update(): void {}
}
