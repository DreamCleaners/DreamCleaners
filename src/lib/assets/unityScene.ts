import { Mesh, TransformNode } from '@babylonjs/core';
import { GameAssetContainer } from './gameAssetContainer';
import { SpawnTrigger } from '../stages/spawnTrigger';

export type UnityScene = {
  container: GameAssetContainer;
  spawnTriggers: SpawnTrigger[];
  arrivalPoint?: TransformNode;
  rootMesh: Mesh;
};
