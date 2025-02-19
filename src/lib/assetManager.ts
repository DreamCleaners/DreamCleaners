import { AssetContainer, LoadAssetContainerAsync, Scene } from '@babylonjs/core';
import '@babylonjs/loaders';

export class AssetManager {
  public static async loadAsset(
    assetName: string,
    scene: Scene,
  ): Promise<AssetContainer> {
    return await LoadAssetContainerAsync(`${assetName}`, scene);
  }
}
