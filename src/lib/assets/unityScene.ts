import { Mesh, TransformNode } from '@babylonjs/core';
import { GameAssetContainer } from './gameAssetContainer';

export type UnityScene = {
  container: GameAssetContainer;
  spawnPoints: TransformNode[];
  arrivalPoint?: TransformNode;
  rootMesh: Mesh;
};
