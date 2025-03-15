import { AssetContainer, InstancedMesh, Light, Mesh, PhysicsAggregate, Scene } from '@babylonjs/core';
import { Game } from '../game';
import { EnemyFactory } from '../enemies/enemyFactory';
import { EnemyType } from '../enemies/enemyType';

export abstract class GameScene {
  public scene: Scene;
  protected enemyManager!: EnemyFactory;

  public assetContainer !: AssetContainer;
  public physicsAggregates: PhysicsAggregate[] = [];
  

  // Difficulty factor, used to scale enemies stats and spawning
  public difficultyFactor = 1;
  // We shall only spawn enemies of these types
  public enemyTypesToSpawn: EnemyType[] = [];

  constructor(protected game: Game) {
    this.assetContainer = new AssetContainer(this.game.scene)
    this.scene = game.scene;
    this.enemyManager = EnemyFactory.getInstance();
  }

  public abstract load(): Promise<void>;

  /**
   * Dispose of any resources used by the scene.
   */
  public async dispose(): Promise<void> {
    console.log('Disposing of scene: ', this.constructor.name);
  
    // Dispose of all physics aggregates
    console.log("Disposing of physics qggregqte count : ", this.physicsAggregates.length);
    console.log("Physics aggregates reference in GameScene: ", Object.getOwnPropertyNames(this.physicsAggregates));

    this.physicsAggregates.forEach((aggregate) => {
      aggregate.dispose();
    });
    this.physicsAggregates = [];
  
    // Dispose of all meshes
    for (const mesh of this.assetContainer.meshes) {
      console.log("Disposing of mesh: ", mesh.name);
      mesh.dispose();
    }
    this.assetContainer.meshes = [];
  
    // Dispose of all lights
    for (const light of this.scene.lights) {
      console.log("Disposing of light: ", light.name);
      light.dispose();
    }
    //this.assetContainer.lights = [];
  
    // Dispose of the asset container itself
    this.assetContainer.dispose();
  
    console.log('Scene disposed: ', this.constructor.name);
  }

  public update(): void {
    console.log("Amount of physics aggregates: ", this.physicsAggregates.length);
  }

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
    console.log("GameScene level, pushed to physics aggregates: ", physicsAggregate);
    console.log("New physics aggregates count: ", this.physicsAggregates.length);
  }

  protected pushToMeshes(mesh: Mesh | InstancedMesh): void {
    this.assetContainer.meshes.push(mesh);
  }

  protected pushToLights(light: Light): void {
    this.assetContainer.lights.push(light);
  }
}
