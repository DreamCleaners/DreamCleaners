import {
  AssetContainer,
  PhysicsAggregate,
  PointLight,
  Vector3,
  Color4,
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

  public fixedStageName!: FixedStageLayout;

  constructor(game: Game, fixedStageName: FixedStageLayout) {
    super(game);
    this.fixedStageName = fixedStageName;
  }

  public async load(): Promise<void> {
    // We clear background color
    this.scene.clearColor = new Color4(0, 0, 0, 255);

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

  /**  */
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
    scene.getDescendants().forEach((node) => {
      name = node.name;
      if (
        name.includes('physical_object') &&
        (node instanceof Mesh || node instanceof InstancedMesh)
      ) {
        this.handlePhysicalObject(node);
      } else if (name.includes('light') && node instanceof Light) {
        this.handleLight(node, name);
      } else {
        // These objects do not require any action from us
      }
    });
  }

  private handlePhysicalObject(node: Mesh | InstancedMesh): void {
    console.log('Found physical object');
    this.assetContainer.meshes.push(node);
    const physicsAggregate = new PhysicsAggregate(node, PhysicsShapeType.BOX, {
      mass: 0,
    });
    this.physicsAggregates.push(physicsAggregate);
  }

  private handleLight(node: Light, name: string): void {
    console.log('Found light: ', name);
    if (name.includes('point')) {
      this.handlePointLight(node);
    } else {
      console.log('Unkown light type: ', name);
    }
  }

  private handlePointLight(node: Light): void {
    const pointLight = node as PointLight;
    this.assetContainer.lights.push(pointLight);
  }

  private loadEnemies(): void {
    // Based on the coordinates we stored previously while parsing the glb
    // We will create enemies, according to the stage particularities
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
    if (this.enemyCount === 0) {
      this.game.scoreManager.endStage();
      this.game.sceneManager.changeSceneToFixedStage(FixedStageLayout.HUB);
    }
  }
}
