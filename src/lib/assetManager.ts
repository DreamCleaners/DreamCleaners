import { AssetContainer, LoadAssetContainerAsync, Scene } from '@babylonjs/core';
import '@babylonjs/loaders';
import { AssetType } from './assetType';

export class AssetManager {
  public static async loadAsset(
    assetType: AssetType,
    assetName: string,
    scene: Scene,
  ): Promise<AssetContainer> {
    switch (assetType) {
      case AssetType.WEAPON:
        return await LoadAssetContainerAsync(
          `weapons/meshes/${assetName.toLowerCase()}.glb`,
          scene,
        );
      default:
        throw new Error('Asset type not recognized');
    }
  }
}
