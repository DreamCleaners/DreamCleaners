import {
  AssetContainer,
  InstancedMesh,
  InstantiatedEntries,
  Light,
  Mesh,
  ParticleSystem,
  PhysicsAggregate,
  Scene,
} from '@babylonjs/core';

export class GameAssetContainer {
  private assetContainer: AssetContainer;
  private physicsAggregates: PhysicsAggregate[] = [];

  constructor(scene: Scene) {
    this.assetContainer = new AssetContainer(scene);
  }

  public static createFromAssetContainer(
    assetContainer: AssetContainer,
  ): GameAssetContainer {
    const container = new GameAssetContainer(assetContainer.scene);
    container.assetContainer = assetContainer;
    return container;
  }

  /**
   * Clone all assets to the scene
   * All instantiated meshes need to be disposed
   */
  public cloneAssetsToScene(): InstantiatedEntries {
    return this.assetContainer.instantiateModelsToScene(
      (sourceName: string): string => sourceName,
      true,
      { doNotInstantiate: true },
    );
  }

  /**
   * Add all assets to the scene and return the root mesh
   */
  public addAssetsToScene(): Mesh {
    this.assetContainer.addAllToScene();

    if (this.assetContainer.meshes.length === 0) {
      return this.assetContainer.createRootMesh();
    } else {
      return this.assetContainer.meshes[0] as Mesh;
    }
  }

  public addMesh(mesh: Mesh | InstancedMesh): void {
    this.assetContainer.meshes.push(mesh);
  }

  public addLight(light: Light): void {
    this.assetContainer.lights.push(light);
  }

  public addPhysicsAggregate(physicsAggregate: PhysicsAggregate): void {
    this.physicsAggregates.push(physicsAggregate);
  }

  public addParticleSystem(particleSystem: ParticleSystem): void {
    this.assetContainer.particleSystems.push(particleSystem);
  }

  public dispose(): void {
    this.physicsAggregates.forEach((aggregate) => {
      aggregate.dispose();
    });
    this.physicsAggregates = [];

    this.assetContainer.removeAllFromScene();
    this.assetContainer.dispose();
  }
}
