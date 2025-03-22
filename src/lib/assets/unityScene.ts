import { Mesh } from '@babylonjs/core';
import { GameAssetContainer } from './gameAssetContainer';

export type UnityScene = {
  container: GameAssetContainer;
  spawnPoints: Mesh[];
  rootMesh: Mesh;
};
