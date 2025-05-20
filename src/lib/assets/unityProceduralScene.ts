import { Mesh, TransformNode } from '@babylonjs/core';
import { GameAssetContainer } from './gameAssetContainer';

export type UnityProceduralScene = {
  spawnRoom: TransformNode;
  endRoom: TransformNode;
  link: TransformNode;
  rooms: TransformNode[];
  rootMesh: Mesh;
  container: GameAssetContainer;
};
