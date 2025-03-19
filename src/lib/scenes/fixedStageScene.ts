import {
  PhysicsAggregate,
  Vector3,
  MeshBuilder,
  PhysicsShapeType,
  Mesh,
  Light,
  InstancedMesh,
  Observer,
} from '@babylonjs/core';
import { AssetType } from '../assets/assetType';
import { Enemy } from '../enemies/enemy';
import { GameEntityType } from '../gameEntityType';
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
    // Simple ground initialization
    this.initGround();

    if (this.fixedStageName === undefined || this.fixedStageName === null) {
      throw new Error('Fixed stage name is not defined');
    }

    // We import the stage scene based on the name
    await this.importScene();

    this.game.player.setPosition(new Vector3(0, 1, 0));

    if (this.fixedStageName === FixedStageLayout.HUB) return;

    this.loadEnemies();
    this.game.scoreManager.startStage();
    this.onPlayerDamageTakenObserver = this.game.player.onDamageTakenObservable.add(
      this.game.scoreManager.onPlayerDamageTaken.bind(this.game.scoreManager),
    );
  }

  public async dispose(): Promise<void> {
    super.dispose();

    this.enemies.forEach((enemy) => {
      enemy.dispose();
    });
    this.enemies = [];

    this.spawnPoints = [];

    this.onPlayerDamageTakenObserver.remove();
  }

  /** Based on a fixed stage name, imports the GLB exported from Unity and correctly loads it
   * and its subcomponents into the scene
   */
  private async importScene(): Promise<void> {
    const entries = await this.game.assetManager.loadAsset(
      this.fixedStageName,
      AssetType.SCENE,
    );

    const scene = entries.rootNodes[0] as Mesh;
    this.pushToMeshes(scene);
    scene.position = new Vector3(0, 0, 0);

    // Iterate through all descendants, we will discriminate each object per its name
    // If we meet a "physical_object" we will create a physics aggregate for it and add
    // it to the physics aggregates array
    // If we meet a "point_light" we will create a point light for it and add it to the lights array
    // And so on
    let name = '';

    scene.getDescendants().forEach((node) => {
      name = node.name.toLowerCase();
      if (
        name.includes('physical_object') &&
        (node instanceof Mesh || node instanceof InstancedMesh)
      ) {
        this.handlePhysicalObject(node);
      } else if (name.includes('light') && node instanceof Light) {
        // No need for particular operations to the light as it is directly exported from Unity
        this.pushToLights(node);
      } else if (name.includes('spawn_point')) {
        this.handleSpawnPoint(node as Mesh);
      } else {
        // These objects do not require any action from us
      }
    });
  }

  private handlePhysicalObject(node: Mesh | InstancedMesh): void {
    this.pushToMeshes(node);
    const physicsAggregate = new PhysicsAggregate(node, PhysicsShapeType.BOX, {
      mass: 0,
    });
    this.pushToPhysicsAggregates(physicsAggregate);
  }

  private handleSpawnPoint(node: Mesh): void {
    node.position.x *= -1;
    this.spawnPoints.push(node.position);
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
      const enemy = this.enemyManager.createEnemy(
        // The spawned enemy is randomly picked from the list of enemy types
        this.enemyTypesToSpawn[Math.floor(Math.random() * this.enemyTypesToSpawn.length)],
        this.difficultyFactor,
        this.game,
      );

      await enemy.initAt(spawnPoint);
      enemy.onDeathObservable.add(this.onEnemyDeath.bind(this));
      this.enemies.push(enemy);
      this.enemyCount++;
    }
  }

  private initGround(): void {
    const ground = MeshBuilder.CreateGround(
      GameEntityType.GROUND,
      { width: 50, height: 50 },
      this.scene,
    );
    this.pushToMeshes(ground);
    const groundPhysicsAggregate = new PhysicsAggregate(ground, PhysicsShapeType.BOX, {
      mass: 0,
    });
    this.pushToPhysicsAggregates(groundPhysicsAggregate);
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
}
