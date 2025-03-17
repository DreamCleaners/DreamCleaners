import { Engine, HavokPlugin, Scene, Vector3 } from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';
import { Inspector } from '@babylonjs/inspector';
import { SceneManager } from './scenes/sceneManager';
import { InputManager } from './inputs/inputManager';
import { Player } from './player/player';
import { InputAction } from './inputs/inputAction';
import { AssetManager } from './assets/assetManager';
import { ScoreManager } from './scoreManager';
import { UIManager } from './ui/uiManager';
import { MoneyManager } from './moneyManager';
import { SaveManager } from './saveManager';
import { UIType } from './ui/uiType';

export class Game {
  public scene!: Scene;
  public inputManager!: InputManager;

  public isPointerLocked = false;
  public canPlayerLockPointer = true;

  // tells if the game forced the pointer to be unlocked
  // if false, the game will pause when the pointer is unlocked
  private isPointerUnlockForced = false;

  public engine!: Engine;
  public sceneManager!: SceneManager;
  private canvas!: HTMLCanvasElement;
  public player!: Player;
  public assetManager!: AssetManager;
  public scoreManager = new ScoreManager();
  public moneyManager = new MoneyManager();
  public uiManager = new UIManager(this);
  public saveManager = new SaveManager();

  private lastFixedUpdate = 0;
  private fixedUpdateInterval = 1000 / 60;

  /**
   * Called one time when the canvas is initialized
   */
  public async init(canvas: HTMLCanvasElement): Promise<void> {
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

    this.saveManager.addSaveable(this.moneyManager);
    this.saveManager.addSaveable(this.player.playerUpgradeManager);

    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    window.addEventListener('resize', this.onResize);

    if (process.env.NODE_ENV === 'development') this.listenToDebugInputs();
  }

  /**
   * Called each time we start a new game or resume a game
   */
  public start(isNewGame: boolean): void {
    if (isNewGame) {
      this.saveManager.reset();
    } else {
      this.saveManager.restore();
    }

    this.player.start();
    this.sceneManager.start();
    this.uiManager.hideUI();
    this.engine.runRenderLoop(this.update.bind(this));
  }

  public stop(): void {
    this.sceneManager.stop();
    this.uiManager.hidePauseMenu();
    this.uiManager.displayUI(UIType.MAIN_MENU);
  }

  public pause(): void {
    this.engine.stopRenderLoop();
    this.uiManager.displayPauseMenu();
  }

  /**
   * Resume the game from the pause menu
   */
  public resume(): void {
    this.engine.runRenderLoop(this.update.bind(this));
    this.uiManager.hidePauseMenu();
  }

  private update(): void {
    this.scene.render();

    if (
      this.inputManager.inputState.actions.get(InputAction.SHOOT) &&
      !this.isPointerLocked &&
      this.canPlayerLockPointer
    ) {
      this.lockPointer();
    }

    if (
      this.inputManager.inputState.actions.get(InputAction.ESCAPE) &&
      this.uiManager.getCurrentUI() !== UIType.MAIN_MENU
    ) {
      this.pause();
      return;
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

  public async lockPointer(): Promise<void> {
    this.isPointerLocked = true;
    this.isPointerUnlockForced = false;
    this.canvas.focus();

    // the request will throw an error if the user exits pointer lock to fast
    // so we need to catch it
    try {
      // unadjustedMovement to disable mouse acceleration
      await this.canvas.requestPointerLock({ unadjustedMovement: true });
    } catch (/*eslint-disable-line*/ err) {
      this.isPointerLocked = false;
    }
  }

  public unlockPointer(): void {
    if (!this.isPointerLocked) return;

    this.isPointerLocked = false;
    this.isPointerUnlockForced = true;
    document.exitPointerLock();
  }

  private onPointerLockChange = (): void => {
    this.isPointerLocked = document.pointerLockElement === this.canvas;

    if (!this.isPointerLocked && !this.isPointerUnlockForced) {
      this.pause();
    }
  };

  private onResize = (): void => {
    this.engine.resize();
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
