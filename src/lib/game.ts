import { Engine, HavokPlugin, Scene, Vector3 } from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';
import { Inspector } from '@babylonjs/inspector';
import { SceneManager } from './sceneManager';
import { InputManager } from './inputs/inputManager';
import { Player } from './player';
import { InputAction } from './inputs/inputAction';
import { AssetManager } from './assetManager';

export class Game {
  public scene!: Scene;
  public inputManager!: InputManager;
  public isPointerLocked = false;

  private engine!: Engine;
  private sceneManager!: SceneManager;
  private canvas!: HTMLCanvasElement;
  public player!: Player;
  public assetManager!: AssetManager;

  private lastFixedUpdate = 0;
  private fixedUpdateInterval = 1000 / 60;

  public async start(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas);
    this.scene = new Scene(this.engine);
    this.assetManager = new AssetManager(this.scene);
    this.inputManager = new InputManager(this.engine);

    const physicsPlugin = await this.getPhysicsPlugin();
    const gravity = new Vector3(0, -9.81, 0);
    this.scene.enablePhysics(gravity, physicsPlugin);

    this.player = new Player(this);
    this.sceneManager = new SceneManager(this);

    document.addEventListener('pointerlockchange', this.onPointerLockChange);

    if (process.env.NODE_ENV === 'development') this.listenToDebugInputs();

    this.engine.runRenderLoop(this.update.bind(this));
  }

  private update(): void {
    this.scene.render();

    if (
      this.inputManager.inputState.actions.get(InputAction.SHOOT) &&
      !this.isPointerLocked
    ) {
      this.lockPointer();
    }

    this.player.update();
    this.sceneManager.update();

    // fixed update loop
    const deltaTime = this.engine.getDeltaTime();
    this.lastFixedUpdate += deltaTime;

    while (this.lastFixedUpdate >= this.fixedUpdateInterval) {
      this.fixedUpdate();
      this.lastFixedUpdate -= this.fixedUpdateInterval;
    }
  }

  private fixedUpdate(): void {
    this.player.fixedUpdate();
    this.sceneManager.fixedUpdate();
  }

  private async getPhysicsPlugin(): Promise<HavokPlugin> {
    const wasmBinary: Response = await fetch('bin/HavokPhysics.wasm');
    const wasmBinaryArrayBuffer = await wasmBinary.arrayBuffer();
    const havokInstance = await HavokPhysics({
      wasmBinary: wasmBinaryArrayBuffer,
    });
    return new HavokPlugin(true, havokInstance);
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

  private listenToDebugInputs(): void {
    window.addEventListener('keydown', (event) => {
      if (event.code === 'KeyI') {
        this.toggleDebugLayer();
      }
    });
  }

  /**
   * Toggle babylonjs inspector
   */
  private toggleDebugLayer(): void {
    if (Inspector.IsVisible) {
      Inspector.Hide();
    } else {
      Inspector.Show(this.scene, { overlay: true, handleResize: true });
    }
  }
}
