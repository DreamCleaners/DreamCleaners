import { Vector3, Observer } from '@babylonjs/core';
import { Enemy } from '../enemies/enemy';
import { GameScene } from './gameScene';
import { Game } from '../game';
import { FixedStageLayout } from './fixedStageLayout';
import { UIType } from '../ui/uiType';

export class FixedStageScene extends GameScene {
  private enemies: Enemy[] = [];
  private enemyCount = 0;

  private spawnPoints: Vector3[] = [];

  // The stage name, used to import the correct scene
  public fixedStageName!: FixedStageLayout;

  private onPlayerDamageTakenObserver!: Observer<number>;
  private onUIChangeObserver!: Observer<UIType>;

  constructor(game: Game, fixedStageName: FixedStageLayout) {
    super(game);
    this.fixedStageName = fixedStageName;
  }

  public async load(): Promise<void> {
    // We import the stage scene based on the name
    const unityScene = await this.game.assetManager.instantiateUnityScene(
      this.fixedStageName,
    );
    this.gameAssetContainer = unityScene.container;

    unityScene.rootMesh.position = new Vector3(0, 0, 0);

    this.spawnPoints = unityScene.spawnPoints.map((point) => point.position);

    this.game.player.setPosition(new Vector3(0, 1, 0));

    await this.loadEnemies();
    this.game.scoreManager.startStage();
    this.onPlayerDamageTakenObserver = this.game.player.onDamageTakenObservable.add(
      this.game.scoreManager.onPlayerDamageTaken.bind(this.game.scoreManager),
    );
  }

  public dispose(): void {
    super.dispose();

    this.enemies.forEach((enemy) => {
      enemy.dispose();
    });
    this.enemies = [];

    this.spawnPoints = [];

    this.onPlayerDamageTakenObserver.remove();
  }

  /**
   * Based on the difficulty factor, the enemyTypes and the spawn point coordinates,
   *  creates enemies and adds them to the enemies array
   * WARNING: Currently we are spawning enemies all at once, however we might want to make different
   * ways of spawn: via proximity, or waves etc
   */
  private async loadEnemies(): Promise<void> {
    // Based on the coordinates we stored previously while parsing the glb
    // We will create enemies, according to the stage particularities
    if (this.spawnPoints.length <= 0) {
      return;
    }

    for (const spawnPoint of this.spawnPoints) {
      const enemy = await this.enemyFactory.createEnemy(
        // The spawned enemy is randomly picked from the list of enemy types
        this.enemyTypesToSpawn[Math.floor(Math.random() * this.enemyTypesToSpawn.length)],
        this.difficultyFactor,
        this.game,
        spawnPoint,
      );

      enemy.onDeathObservable.add(this.onEnemyDeath.bind(this));
      this.enemies.push(enemy);
      this.enemyCount++;
    }
  }

  public update(): void {
    this.enemies.forEach((enemy) => {
      enemy.update();
    });
  }

  public fixedUpdate(): void {
    this.enemies.forEach((enemy) => {
      enemy.fixedUpdate();
    });
  }

  private onEnemyDeath(): void {
    this.game.scoreManager.onEnemyDeath();

    this.enemyCount--;
    // WARNING: This is the end condition for the basic "no enemy left = end of stage"
    // We might add in the future more complex conditions, for example time limit and so on
    if (this.enemyCount === 0) {
      this.onEndStage();
    }
  }

  private onEndStage(): void {
    this.game.scoreManager.endStage();
    this.attributeRewards();

    setTimeout(() => {
      const currentUI = this.game.uiManager.getCurrentUI();

      if (currentUI === UIType.MAIN_MENU) return;

      this.game.uiManager.displayUI(UIType.SCORE);
      this.onUIChangeObserver = this.game.uiManager.onUIChange.add(
        this.onUIChange.bind(this),
      );
    }, 2000);
  }

  private onUIChange(uiType: UIType): void {
    if (uiType === UIType.MAIN_MENU) {
      this.onUIChangeObserver.remove();
      return;
    }

    if (uiType !== UIType.PLAYER_HUD) return;

    this.onUIChangeObserver.remove();
    this.game.sceneManager.changeSceneToFixedStage(FixedStageLayout.HUB);
  }

  /** Gives the rewards to the player */
  private attributeRewards(): void {
    if (this.stageReward === null) {
      throw new Error('Stage reward is not defined');
    }

    console.log('Attributing gold reward: ' + this.stageReward.getMoneyReward());
    this.game.moneyManager.addPlayerMoney(this.stageReward.getMoneyReward());
  }
}
