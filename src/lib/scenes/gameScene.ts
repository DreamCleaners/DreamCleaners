import {
  AssetContainer,
  InstancedMesh,
  Light,
  Mesh,
  PhysicsAggregate,
  Scene,
} from '@babylonjs/core';
import { Game } from '../game';
import { EnemyFactory } from '../enemies/enemyFactory';
import { EnemyType } from '../enemies/enemyType';

export abstract class GameScene {
  public scene: Scene;
  protected enemyManager!: EnemyFactory;

  public assetContainer!: AssetContainer;
  public physicsAggregates: PhysicsAggregate[] = [];

  // Difficulty factor, used to scale enemies stats and spawning
  public difficultyFactor = 1;
  // We shall only spawn enemies of these types
  public enemyTypesToSpawn: EnemyType[] = [];

  constructor(protected game: Game) {
    this.assetContainer = new AssetContainer(this.game.scene);
    this.scene = game.scene;
    this.enemyManager = EnemyFactory.getInstance();
  }

  public abstract load(): Promise<void>;

  /**
   * Dispose of any resources used by the scene.
   */
  public async dispose(): Promise<void> {
    // Dispose of all physics aggregates
    this.physicsAggregates.forEach((aggregate) => {
      aggregate.dispose();
    });
    this.physicsAggregates = [];

    // Dispose all assets in the asset container
    this.assetContainer.dispose();
  }

  public update(): void {}

  public fixedUpdate(): void {}

  public setStageParameters(difficultyFactor: number, enemyTypes: EnemyType[]): void {
    this.difficultyFactor = difficultyFactor;
    this.enemyTypesToSpawn = enemyTypes;
    console.log(
      'Stage will be of difficulty: ' +
        difficultyFactor +
        ' and will spawn enemies of types: ',
      enemyTypes,
    );
  }

  protected pushToPhysicsAggregates(physicsAggregate: PhysicsAggregate): void {
    this.physicsAggregates.push(physicsAggregate);
  }

  protected pushToMeshes(mesh: Mesh | InstancedMesh): void {
    this.assetContainer.meshes.push(mesh);
  }

  protected pushToLights(light: Light): void {
    this.assetContainer.lights.push(light);
  }
}
