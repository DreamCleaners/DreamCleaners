import {
  IBasePhysicsCollisionEvent,
  Mesh,
  MeshBuilder,
  Observer,
  PhysicsAggregate,
  PhysicsEventType,
  PhysicsShapeType,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import { Enemy } from '../enemies/enemy';
import { GameScene } from './gameScene';
import { StageLayout } from './stageLayout';
import { UnityScene } from '../assets/unityScene';
import { Game } from '../game';
import { NavigationManager } from '../navigationManager';
import { UIType } from '../ui/uiType';
import { GameEntityType } from '../gameEntityType';
import { SpawnTrigger } from '../stages/spawnTrigger';
import { IMetadataObject } from '../metadata/metadataObject';
import { StageDataManager } from './stageDataManager';

export class StageScene extends GameScene {
  private enemies: Enemy[] = [];

  private arrivalPoint: Vector3 = Vector3.Zero();

  private onPlayerDamageTakenObserver!: Observer<number>;
  private onCollisionObserver!: Observer<IBasePhysicsCollisionEvent>;

  constructor(game: Game, stageLayout: StageLayout) {
    super(game, stageLayout);
  }

  public async load(): Promise<void> {
    const stageData = StageDataManager.getInstance().getStageData(this.stageLayout);

    if (stageData.proceduralOptions !== undefined) {
      this.gameAssetContainer = await this.loadProceduralStageContainer(
        stageData.proceduralOptions,
      );
    } else {
      this.gameAssetContainer = await this.loadFixedStageContainer();
    }

    this.unityScene = await this.game.assetManager.instantiateUnityScene(
      this.gameAssetContainer,
      this.stageLayout,
    );

    this.unityScene.rootMesh.position = new Vector3(0, 0, 0);

    this.initArrivalPoint(this.unityScene);

    this.onCollisionObserver = this.game.physicsPlugin.onTriggerCollisionObservable.add(
      this.onCollision.bind(this),
    );

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

    const allMeshes = this.unityScene.rootMesh.getChildMeshes();
    // We exclude all children of the object named #IGNORE_NAV_MESH#
    const ignoreNode = this.unityScene.rootMesh
      .getChildTransformNodes()
      .find((node) => node.name === '#IGNORE_NAV_MESH#');

    // Filter out meshes that are descendants of the ignore node
    const navigationMeshes = ignoreNode
      ? allMeshes.filter((mesh) => !mesh.isDescendantOf(ignoreNode))
      : allMeshes;

    this.navigationManager.createNavmesh(navigationMeshes as Mesh[], parameters);

    this.game.player.setPosition(new Vector3(0, 1, 0));

    this.game.scoreManager.startStage();
    this.game.soundManager.playStageBackgroundMusic();
    this.onPlayerDamageTakenObserver = this.game.player.onDamageTakenObservable.add(
      this.game.scoreManager.onPlayerDamageTaken.bind(this.game.scoreManager),
    );

    this.enemyFactory.preloadEnemyAssets(this.stageInfo.enemyTypes, this.game);
  }

  public dispose(): void {
    super.dispose();

    this.enemies.forEach((enemy) => {
      enemy.dispose();
    });
    this.enemies = [];

    this.onPlayerDamageTakenObserver.remove();

    this.onCollisionObserver.remove();
  }

  private initArrivalPoint(unityScene: UnityScene): void {
    if (!unityScene.arrivalPoint) {
      throw new Error('Arrival point is not defined');
    }
    this.arrivalPoint = unityScene.arrivalPoint.absolutePosition;

    const arrivalPointHitbox = MeshBuilder.CreateSphere(
      GameEntityType.ARRIVAL_POINT,
      { diameter: 2 },
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
    this.gameAssetContainer.addPhysicsAggregate(arrivalPointPhysicsAggregate);
  }

  /**
   * Based on the difficulty factor, the enemyTypes and the spawn point coordinates,
   *  creates enemies and adds them to the enemies array
   */
  private async spawnEnemies(spawnPoints: TransformNode[]): Promise<void> {
    for (const spawnPoint of spawnPoints) {
      const enemy = await this.enemyFactory.createEnemy(
        // The spawned enemy is randomly picked from the list of enemy types
        this.stageInfo.enemyTypes[
          Math.floor(Math.random() * this.stageInfo.enemyTypes.length)
        ],
        this.stageInfo.difficulty,
        this,
        spawnPoint.absolutePosition,
      );

      enemy.onDeathObservable.add(this.onEnemyDeath.bind(this, enemy));
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

    this.checkPlayerOutOfBounds();
  }

  private checkPlayerOutOfBounds(): void {
    const playerPosition = this.game.player.getPosition();
    if (playerPosition.y < -50) {
      this.game.soundManager.playPlayerDeath();
      this.game.gameOver();
    }
  }

  private onEnemyDeath(enemy: Enemy): void {
    this.game.scoreManager.onEnemyDeath();
    this.enemies = this.enemies.filter((e) => e !== enemy);
  }

  private onCollision(collisionEvent: IBasePhysicsCollisionEvent): void {
    const collider = collisionEvent.collider;
    const collidedAgainst = collisionEvent.collidedAgainst;

    if (collisionEvent.type !== PhysicsEventType.TRIGGER_ENTERED) return;

    if (
      collider.transformNode.name === GameEntityType.PLAYER &&
      collidedAgainst.transformNode.name === GameEntityType.ARRIVAL_POINT
    ) {
      this.onCollisionObserver.remove();
      this.onEndStage();
    } else if (
      collider.transformNode.name === GameEntityType.PLAYER &&
      collidedAgainst.transformNode.name === GameEntityType.SPAWN_TRIGGER
    ) {
      const metadata = collidedAgainst.transformNode
        .metadata as IMetadataObject<SpawnTrigger>;
      this.spawnEnemies(metadata.object.spawnPoints);
      metadata.object.dispose();
    }
  }

  private onEndStage(): void {
    this.game.scoreManager.endStage();
    this.game.runManager.incrementStageCompleted();
    this.attributeRewards();
    this.game.soundManager.stopStageBackgroundMusic();

    // Safety net to ensure the player is safe and enemies are cleared
    this.clearEnemiesAndSafePlayer();

    // Player cleared a stage, we must soft-reset the shop
    this.game.shopManager.resetShop();

    this.game.uiManager.displayUI(UIType.SCORE);
  }

  public changeSceneToHub(): void {
    this.game.sceneManager.changeScene(StageLayout.HUB);
  }

  /** Gives the rewards to the player */
  private attributeRewards(): void {
    if (this.stageInfo.stageReward === null) {
      throw new Error('Stage reward is not defined');
    }

    this.game.moneyManager.addPlayerMoney(
      this.stageInfo.stageReward.getMoneyReward() *
        this.game.scoreManager.getScoreFactor(),
    );
  }

  /** Clears enemies in the scene and makes the player "invicible" to avoid triggering multiple game overs */
  public clearEnemiesAndSafePlayer(): void {
    this.game.player.healthController.addHealth(100000);

    // We also kill all enemies
    this.enemies.forEach((enemy) => {
      enemy.dispose();
    });
    this.enemies = [];
  }
}
