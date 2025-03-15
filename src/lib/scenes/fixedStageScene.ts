import {
  AssetContainer,
  PhysicsAggregate,
  PointLight,
  Vector3,
  MeshBuilder,
  PhysicsShapeType,
  Mesh,
  Light,
  InstancedMesh,
} from '@babylonjs/core';
import { AssetType } from '../assetType';
import { Enemy } from '../enemies/enemy';
import { GameEntityType } from '../gameEntityType';
import { GameScene } from './gameScene';
import { Game } from '../game';
import { FixedStageLayout } from './fixedStageLayout';

export class FixedStageScene extends GameScene {
  private assetContainer: AssetContainer = new AssetContainer(this.game.scene);
  private physicsAggregates: PhysicsAggregate[] = [];

  private enemies: Enemy[] = [];
  private enemyCount = 0;

  private spawnPoints: Vector3[] = [];

  // The stage name, used to import the correct scene
  public fixedStageName!: FixedStageLayout;

  constructor(game: Game, fixedStageName: FixedStageLayout) {
    super(game);
    this.fixedStageName = fixedStageName;
  }

  public async load(): Promise<void> {
    // We clear background color
    //this.scene.clearColor = new Color4(0, 0, 0, 255);

    // Simple ground initialization
    this.initGround();

    this.game.scoreManager.reset();
    this.game.player.onDamageTakenObservable.add(
      this.game.scoreManager.onPlayerDamageTaken.bind(this.game.scoreManager),
    );

    if (this.fixedStageName === undefined || this.fixedStageName === null) {
      console.error('Fixed stage name is not defined');
    } else {
      // We import the stage scene based on the name
      await this.importScene();
      this.loadEnemies();
      this.game.player.resetHealth();
    }
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
    this.assetContainer.meshes.push(scene);
    scene.position = new Vector3(0, 0, 0);

    // Iterate through all descendants, we will discriminate each object per its name
    // If we meet a "physical_object" we will create a physics aggregate for it and add
    // it to the physics aggregates array
    // If we meet a "point_light" we will create a point light for it and add it to the lights array
    // And so on
    let name = '';
    let physicObjectsCount = 0;
    let lightCount = 0;
    let spawnPointCount = 0;

    scene.getDescendants().forEach((node) => {
      name = node.name;
      if (
        name.includes('physical_object') &&
        (node instanceof Mesh || node instanceof InstancedMesh)
      ) {
        physicObjectsCount++;
        this.handlePhysicalObject(node);
      } else if (name.includes('light') && node instanceof Light) {
        lightCount++;
        this.handleLight(node, name);
      } else if (name.includes('spawn_point')) {
        spawnPointCount++;
        this.handleSpawnPoint(node as Mesh);
      } else {
        // These objects do not require any action from us
      }
    });

    console.log(
      'Successfully imported scene: ',
      this.fixedStageName,
      ' found ',
      physicObjectsCount,
      ' objects with physics, ',
      lightCount,
      ' lights and ',
      spawnPointCount,
      ' enemy spawn points',
    );
  }

  private handlePhysicalObject(node: Mesh | InstancedMesh): void {
    this.assetContainer.meshes.push(node);
    const physicsAggregate = new PhysicsAggregate(node, PhysicsShapeType.BOX, {
      mass: 0,
    });
    this.physicsAggregates.push(physicsAggregate);
  }

  private handleLight(node: Light, name: string): void {
    if (name.includes('point')) {
      this.handlePointLight(node);
    } else {
      console.log('Unknown light type: ', name);
    }
  }

  private handlePointLight(node: Light): void {
    const pointLight = node as PointLight;
    this.assetContainer.lights.push(pointLight);
  }

  private handleSpawnPoint(node: Mesh): void {
    this.spawnPoints.push(node.position);
  }

  /** Based on the difficulty factor, the enemyTypes and the spawn point coordinates,
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

    // For now we will spawn all enemies at once
    console.log('Spawning ' + this.spawnPoints.length + ' enemies');

    for (const spawnPoint of this.spawnPoints) {
      const enemy = this.enemyManager.createEnemy(
        // The spawned enemy is randomly picked from the list of enemy types
        this.enemyTypesToSpawn[Math.floor(Math.random() * this.enemyTypesToSpawn.length)],
        this.difficultyFactor,
        this.game,
      );

      // Re-scale the spawn point to fit the game world
      const destinationSpawnPoint = new Vector3(
        spawnPoint.x * 0.05,
        spawnPoint._y,
        spawnPoint.z * 0.05,
      );
      console.log('Spawning enemy at: ', destinationSpawnPoint);

      await enemy.initAt(destinationSpawnPoint);
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
    this.assetContainer.meshes.push(ground);
    const groundPhysicsAggregate = new PhysicsAggregate(ground, PhysicsShapeType.BOX, {
      mass: 0,
    });
    this.physicsAggregates.push(groundPhysicsAggregate);
  }

  public async dispose(): Promise<void> {
    this.physicsAggregates.forEach((physicsAggregate) => {
      physicsAggregate.dispose();
    });
    this.physicsAggregates = [];

    this.assetContainer.dispose();
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
      this.game.scoreManager.endStage();
      this.game.sceneManager.changeSceneToFixedStage(FixedStageLayout.HUB);
    }
  }
}
