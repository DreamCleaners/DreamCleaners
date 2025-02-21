import { UniversalCamera, Vector3 } from '@babylonjs/core';
import { InputState } from './inputs/inputState';
import { Game } from './game';
import { AssetManager } from './assetManager';
import { Weapon } from './weapons/weapon';
import { WeaponRarity } from './weapons/weaponRarity';

export class Player {
  private inputs: InputState;
  private camera!: UniversalCamera;
  private speed = 7;

  constructor(private game: Game) {
    this.inputs = game.inputManager.inputState;
    this.initPlayerCamera();

    // Debug
    console.log('Init glock for debug');
    new Weapon(game, 'glock', WeaponRarity.LEGENDARY);

    this.init();
  }

  private initPlayerCamera(): void {
    this.camera = new UniversalCamera(
      'playerCamera',
      new Vector3(0, 2, -10),
      this.game.scene,
    );

    this.camera.setTarget(Vector3.Zero());
    this.camera.attachControl(this.game.scene.getEngine().getRenderingCanvas(), true); // Enable mouse control
    // Attach control binds the camera to mouse and keyboard inputs, we want to use only mouse inputs
    // So we remove all unwelcomed inputs

    this.camera.inputs.removeByType('FreeCameraKeyboardMoveInput');
    this.camera.inputs.removeByType('FreeCameraGamepadInput');
    this.camera.inputs.removeByType('FreeCameraTouchInput');

    // No deceleration
    this.camera.inertia = 0;
    // Cam sensitivity
    this.camera.angularSensibility = 1000;
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
    this.movePlayer(deltaTime);
  }

  /**Moves the player based on InputState directions. Currently only moves the camera. */
  private movePlayer(deltaTime: number): void {
    const direction = new Vector3(this.inputs.directions.x, 0, this.inputs.directions.y);

    const directionX = direction.x * deltaTime * this.speed;
    const directionY = direction.z * deltaTime * this.speed;
    this.camera.position.x +=
      directionY * Math.sin(this.camera.rotation.y) +
      directionX * Math.cos(this.camera.rotation.y);
    this.camera.position.z +=
      directionY * Math.cos(this.camera.rotation.y) -
      directionX * Math.sin(this.camera.rotation.y);
  }
}
