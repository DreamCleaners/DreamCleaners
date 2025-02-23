import {
  AssetContainer,
  InstantiatedEntries,
  LoadAssetContainerAsync,
  Scene,
} from '@babylonjs/core';
import '@babylonjs/loaders';
import { AssetType } from './assetType';

export class AssetManager {
  private loadedContainers: Map<string, AssetContainer> = new Map();

  constructor(private scene: Scene) {}

  /**
   * Load an asset or clone it from the cache
   */
  public async loadAsset(
    assetName: string,
    assetType: AssetType,
  ): Promise<InstantiatedEntries> {
    const assetKey = `meshes/${assetType}/${assetName}`;

    let container = this.loadedContainers.get(assetKey);
    if (!container) {
      container = await LoadAssetContainerAsync(`${assetKey}.glb`, this.scene);
      this.loadedContainers.set(assetKey, container);
    }

    return container.instantiateModelsToScene(
      (sourceName: string): string => sourceName,
      true,
      { doNotInstantiate: true },
    );
  }

  /**
   * Dispose the asset container associated with the asset name
   * The container will be removed from the cache
   */
  public unloadAsset(assetName: string, assetType: AssetType): void {
    const assetKey = `meshes/${assetType}/${assetName}`;
    const container = this.loadedContainers.get(assetKey);
    if (container) {
      container.dispose();
      this.loadedContainers.delete(assetKey);
    }
  }
}
