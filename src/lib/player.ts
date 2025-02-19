import { UniversalCamera, Vector3 } from '@babylonjs/core';
import { InputState } from './inputs/inputState';
import { Game } from './game';
import { AssetManager } from './assetManager';

export class Player {
  private inputs: InputState;
  private camera: UniversalCamera;
  private speed = 7;

  constructor(private game: Game) {
    this.inputs = game.inputManager.inputState;
    this.camera = new UniversalCamera(
      'playerCamera',
      new Vector3(0, 2, -10),
      this.game.scene,
    );
    this.camera.setTarget(Vector3.Zero());

    this.init();
  }

  // Just for testing purposes
  private async init(): Promise<void> {
    const container = await AssetManager.loadAsset('glock.glb', this.game.scene);
    container.addAllToScene();
    const glock = container.meshes[0];
    glock.parent = this.camera;
    glock.position.addInPlace(new Vector3(0.5, -0.4, 1.5));
    glock.rotation.z = Math.PI;
    glock.scaling = new Vector3(0.15, 0.15, 0.15);
  }

  public update(deltaTime: number): void {
    if (!this.game.isPointerLocked) return;
    this.move(deltaTime);
  }

  private move(deltaTime: number): void {
    const directionX = this.inputs.directions.x * deltaTime * this.speed;
    const directionY = this.inputs.directions.y * deltaTime * this.speed;
    this.camera.position.x +=
      directionY * Math.sin(this.camera.rotation.y) +
      directionX * Math.cos(this.camera.rotation.y);
    this.camera.position.z +=
      directionY * Math.cos(this.camera.rotation.y) -
      directionX * Math.sin(this.camera.rotation.y);

    const axis = this.inputs.getAxis();
    this.camera.rotation.y += axis.x * deltaTime;
    this.camera.rotation.x += axis.y * deltaTime;
  }
}
