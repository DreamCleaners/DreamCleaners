import {
  Engine,
  GlowLayer,
  HavokPlugin,
  Observable,
  Scene,
  Vector3,
} from '@babylonjs/core';
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
import { RecastInjection } from './navigationManager';
import Recast from 'recast-detour';
import { RunManager } from './runManager';
import { StagesManager } from './stages/stagesManager';
import { weaponDataManager } from './weapons/weaponDataManager';
import { ShopManager } from './shop/shopManager';
import { PlayerPassiveFactory } from './shop/playerPassiveFactory';
import { WorkbenchManager } from './shop/workbench/workbenchManager';
import { StageInformationManager } from './ui/stageInfoManager';
import { SoundManager } from './sound/soundManager';
import { SettingType } from './settingType';

export class Game {
  public scene!: Scene;
  public inputManager!: InputManager;

  public readonly VERSION = '0.2.0';

  public isPointerLocked = false;
  public canPlayerLockPointer = true;

  // tells if the game forced the pointer to be unlocked
  // if false, the game will pause when the pointer is unlocked
  private isPointerUnlockForced = false;

  public engine!: Engine;
  public sceneManager!: SceneManager;
  public physicsPlugin!: HavokPlugin;
  private canvas!: HTMLCanvasElement;
  public player!: Player;
  public assetManager!: AssetManager;
  public scoreManager!: ScoreManager;
  public moneyManager = new MoneyManager();
  public uiManager = new UIManager(this);
  public stageInformationManager = new StageInformationManager();
  public saveManager = new SaveManager();
  public stageManager = StagesManager.getInstance();
  public recastInjection: RecastInjection;
  public runManager = new RunManager();
  public weaponDataManager = new weaponDataManager();
  public shopManager!: ShopManager;
  public workbenchManager!: WorkbenchManager;
  public playerPassiveFactory!: PlayerPassiveFactory;
  public soundManager!: SoundManager;
  public glowLayer!: GlowLayer;

  private fixedUpdateTimer = 0;
  private fixedUpdateInterval = 1000 / 60;

  private startPauseTime = 0;
  private endPauseTime = 0;
  private isFirstFrameAfterPause = false;

  private readonly DEFAULT_GRAPHICS_QUALITY = 1;

  private showFPS: boolean = false;
  public onFPSChange = new Observable<number>();

  public isNewGame = false;

  private readonly BASE_PLAYER_MONEY = 500;

  /**
   * Called one time when the canvas is initialized
   */
  public async init(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas);
    this.scene = new Scene(this.engine);
    this.assetManager = new AssetManager(this.scene);
    this.inputManager = new InputManager(this.engine);
    this.recastInjection = await Recast.bind({})();

    this.setGraphicsQuality(
      parseInt(
        window.localStorage.getItem(SettingType.GRAPHICS_QUALITY) ??
          this.DEFAULT_GRAPHICS_QUALITY.toString(),
      ),
    );

    this.showFPS = window.localStorage.getItem(SettingType.SHOW_FPS) === 'true';

    this.physicsPlugin = await this.getPhysicsPlugin();
    const gravity = Vector3.Zero();
    this.scene.enablePhysics(gravity, this.physicsPlugin);

    this.glowLayer = new GlowLayer('glow', this.scene);
    this.glowLayer.intensity = 0.5;
    this.glowLayer.renderingGroupId = 0;

    this.playerPassiveFactory = new PlayerPassiveFactory(this);

    this.player = new Player(this);
    this.sceneManager = new SceneManager(this);

    this.soundManager = new SoundManager(this.player);
    await this.soundManager.init();
    //this.soundManager.playBackgroundMusic('main-menu', 'main-menu-default');

    this.scoreManager = new ScoreManager(this);

    this.shopManager = new ShopManager(this);
    this.workbenchManager = new WorkbenchManager(this);

    this.saveManager.addSaveable(this.moneyManager);
    this.saveManager.addSaveable(this.runManager);
    this.saveManager.addSaveable(this.player.getInventory());
    this.saveManager.addSaveable(this.stageManager);

    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    window.addEventListener('resize', this.onResize);

    if (process.env.NODE_ENV === 'development') this.listenToDebugInputs();
  }

  /**
   * Called each time we start a new game or resume a game
   */
  public start(isNewGame: boolean): void {
    this.isNewGame = isNewGame;
    if (isNewGame) {
      this.saveManager.reset();
      this.moneyManager.addPlayerMoney(this.BASE_PLAYER_MONEY);
    } else {
      this.saveManager.restore();
    }

    this.player.start();
    this.sceneManager.start();
    this.stageManager.start(isNewGame);
    this.uiManager.hideUI();
    this.engine.runRenderLoop(this.update.bind(this));
  }

  public stop(): void {
    this.sceneManager.stop();
    this.uiManager.hidePauseMenu();
    this.uiManager.displayUI(UIType.MAIN_MENU);
  }

  public pause(): void {
    this.uiManager.dismissNotification();
    this.soundManager.pauseAllSounds();
    this.engine.stopRenderLoop();
    this.startPauseTime = performance.now();
    this.uiManager.displayPauseMenu();
  }

  /**
   * Resume the game from the pause menu
   */
  public resume(): void {
    this.soundManager.resumeAllSounds();
    this.isFirstFrameAfterPause = true;
    this.endPauseTime = performance.now();
    this.engine.runRenderLoop(this.update.bind(this));
    this.uiManager.hidePauseMenu();
  }

  /**
   * Delta time between the current update (frame) and the previous update (frame)
   */
  public getDeltaTime(): number {
    if (this.isFirstFrameAfterPause) {
      const pauseDuration = this.endPauseTime - this.startPauseTime;
      return this.engine.getDeltaTime() - pauseDuration;
    }
    return this.engine.getDeltaTime();
  }

  /**
   * Fixed delta time between each fixed update (60 times per second)
   */
  public getFixedDeltaTime(): number {
    return this.fixedUpdateInterval;
  }

  /**
   * Update loop called each frame
   */
  private update(): void {
    this.onFPSChange.notifyObservers(this.engine.getFps());

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
    this.soundManager.updateSpatialSounds();

    // fixed update loop
    const deltaTime = this.getDeltaTime();
    this.fixedUpdateTimer += deltaTime;

    while (this.fixedUpdateTimer >= this.fixedUpdateInterval) {
      this.fixedUpdate();
      this.fixedUpdateTimer -= this.fixedUpdateInterval;
    }

    // reset the variable after all objects have been updated in this frame
    if (this.isFirstFrameAfterPause) this.isFirstFrameAfterPause = false;
  }

  /**
   * Fixed update loop called 60 times per second (not dependent on frame rate)
   */
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

  // Game over ----------------
  public gameOver(): void {

    this.soundManager.stopStageBackgroundMusic();
    this.uiManager.displayUI(UIType.GAME_OVER);
    this.engine.stopRenderLoop();
  }

  // Settings ----------------

  public getGraphicsQuality(): number {
    return this.engine.getHardwareScalingLevel();
  }

  public setGraphicsQuality(quality: number): void {
    this.engine.setHardwareScalingLevel(quality);
    this.engine.resize();

    window.localStorage.setItem(SettingType.GRAPHICS_QUALITY, quality.toString());
  }

  public isFPSVisible(): boolean {
    return this.showFPS;
  }

  public setFPSVisibility(visible: boolean): void {
    this.showFPS = visible;

    window.localStorage.setItem(SettingType.SHOW_FPS, visible.toString());
  }
}
