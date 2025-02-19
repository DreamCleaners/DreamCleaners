import { Engine, Scene } from '@babylonjs/core';
import { SceneManager } from './sceneManager';
import { InputManager } from './inputs/inputManager';
import { Player } from './player';
import { InputAction } from './inputs/inputAction';

export class Game {
  public scene!: Scene;
  public inputManager!: InputManager;
  public isPointerLocked = false;

  private engine!: Engine;
  private sceneManager!: SceneManager;
  private player!: Player;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas);
    this.scene = new Scene(this.engine);
    this.sceneManager = new SceneManager(this.scene);
    this.inputManager = new InputManager(this.engine);
    this.player = new Player(this);

    document.addEventListener('pointerlockchange', this.onPointerLockChange);

    this.engine.runRenderLoop(() => {
      this.update();
      this.scene.render();
    });
  }

  private update(): void {
    const deltaTime = this.engine.getDeltaTime() / 1000;

    if (
      this.inputManager.inputState.actions.get(InputAction.SHOOT) &&
      !this.isPointerLocked
    ) {
      this.lockPointer();
    }

    this.player.update(deltaTime);
    this.sceneManager.update();
  }

  private async lockPointer(): Promise<void> {
    this.isPointerLocked = true;

    // the request will throw an error if the user exits pointer lock to fast
    // so we need to catch it
    try {
      // unadjustedMovement to disable mouse acceleration
      await this.canvas.requestPointerLock({ unadjustedMovement: true });
    } catch (/*eslint-disable-line*/ err) {
      this.isPointerLocked = false;
    }
  }

  private onPointerLockChange = (): void => {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
  };
}
