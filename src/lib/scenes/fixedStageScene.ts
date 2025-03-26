import {
  Vector3,
  Observer,
  Mesh,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  IBasePhysicsCollisionEvent,
  PhysicsEventType,
} from '@babylonjs/core';
import { Enemy } from '../enemies/enemy';
import { GameScene } from './gameScene';
import { Game } from '../game';
import { FixedStageLayout } from './fixedStageLayout';
import { UIType } from '../ui/uiType';
import { NavigationManager } from '../navigationManager';
import { GameEntityType } from '../gameEntityType';
import { UnityScene } from '../assets/unityScene';

export class FixedStageScene extends GameScene {
  private enemies: Enemy[] = [];

  private spawnPoints: Vector3[] = [];
  private arrivalPoint: Vector3 = Vector3.Zero();

  // The stage name, used to import the correct scene
  public fixedStageName!: FixedStageLayout;

  private onPlayerDamageTakenObserver!: Observer<number>;
  private onUIChangeObserver!: Observer<UIType>;
  private onCollisionObserver!: Observer<IBasePhysicsCollisionEvent>;

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

    this.initArrivalPoint(unityScene);

    this.navigationManager = new NavigationManager(
      this.game.recastInjection,
      this.scene,
      100, // Temporary! -> not every stage will have the same parameters
    );

    // Temporary! -> not every stage will have the same parameters
    const parameters = {
      cs: 0.2, // voxel cell size on xz plane
      ch: 0.2, // voxel cell height on y axis
      walkableSlopeAngle: 45, // max slope in degrees
      walkableHeight: 5, // min height a walkable area must have
      walkableClimb: 3, // how high can the character step up without jumping
      walkableRadius: 1, // radius of the character
      maxEdgeLen: 12,
      maxSimplificationError: 1.3,
      minRegionArea: 8,
      mergeRegionArea: 20,
      maxVertsPerPoly: 6,
      detailSampleDist: 6,
      detailSampleMaxError: 1,
    };

    const meshes = unityScene.rootMesh.getChildMeshes();
    this.navigationManager.createNavmesh(meshes as Mesh[], parameters, true);

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

  private initArrivalPoint(unityScene: UnityScene): void {
    if (!unityScene.arrivalPoint) {
      throw new Error('Arrival point is not defined');
    }
    this.arrivalPoint = unityScene.arrivalPoint.position;

    const arrivalPointHitbox = MeshBuilder.CreateBox(
      GameEntityType.ARRIVAL_POINT,
      { width: 2, height: 2, depth: 2 },
      this.scene,
    );
    arrivalPointHitbox.position = this.arrivalPoint.clone();
    arrivalPointHitbox.position.y += 1.5;
    arrivalPointHitbox.isVisible = false;
    this.gameAssetContainer.addMesh(arrivalPointHitbox);

    const arrivalPointPhysicsAggregate = new PhysicsAggregate(
      arrivalPointHitbox,
      PhysicsShapeType.BOX,
      { mass: 0 },
      this.scene,
    );
    arrivalPointPhysicsAggregate.shape.isTrigger = true;
    this.onCollisionObserver = this.game.physicsPlugin.onTriggerCollisionObservable.add(
      this.onCollision.bind(this),
    );
    this.gameAssetContainer.addPhysicsAggregate(arrivalPointPhysicsAggregate);
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
        this,
        spawnPoint,
      );

      enemy.onDeathObservable.add(this.onEnemyDeath.bind(this));
      this.enemies.push(enemy);
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
  }

  private onCollision(collisionEvent: IBasePhysicsCollisionEvent): void {
    const collider = collisionEvent.collider;
    const collidedAgainst = collisionEvent.collidedAgainst;

    const isPlayerArrivalPointCollision =
      collider.transformNode.name === GameEntityType.PLAYER &&
      collidedAgainst.transformNode.name === GameEntityType.ARRIVAL_POINT;

    const isArrivalPointPlayerCollision =
      collider.transformNode.name === GameEntityType.ARRIVAL_POINT &&
      collidedAgainst.transformNode.name === GameEntityType.PLAYER;

    if (
      collisionEvent.type === PhysicsEventType.TRIGGER_ENTERED &&
      (isPlayerArrivalPointCollision || isArrivalPointPlayerCollision)
    ) {
      this.onCollisionObserver.remove();
      this.onEndStage();
    }
  }

  private onEndStage(): void {
    this.game.scoreManager.endStage();
    this.attributeRewards();

    this.game.uiManager.displayUI(UIType.SCORE);
    this.onUIChangeObserver = this.game.uiManager.onUIChange.add(
      this.onUIChange.bind(this),
    );
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

    this.game.moneyManager.addPlayerMoney(this.stageReward.getMoneyReward());
  }
}
