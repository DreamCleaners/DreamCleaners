import {
  AssetContainer,
  InstancedMesh,
  InstantiatedEntries,
  Light,
  Mesh,
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

  public instantiateModelsToScene(): InstantiatedEntries {
    return this.assetContainer.instantiateModelsToScene(
      (sourceName: string): string => sourceName,
      true,
      { doNotInstantiate: true },
    );
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

  public dispose(): void {
    this.physicsAggregates.forEach((aggregate) => {
      aggregate.dispose();
    });
    this.physicsAggregates = [];

    this.assetContainer.dispose();
  }
}
