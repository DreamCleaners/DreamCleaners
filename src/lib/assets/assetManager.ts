import {
  InstancedMesh,
  LoadAssetContainerAsync,
  Mesh,
  PhysicsAggregate,
  PhysicsShapeType,
  Scene,
  Texture,
  TransformNode,
} from '@babylonjs/core';
import '@babylonjs/loaders';
import { AssetType } from './assetType';
import { GameAssetContainer } from './gameAssetContainer';
import { UnityPhysicShapeToken, UnityTypeToken } from './unityTokens';
import { UnityScene } from './unityScene';
import { SpawnTrigger } from '../stages/spawnTrigger';

export class AssetManager {
  constructor(private scene: Scene) {}

  public async loadGameAssetContainer(
    assetName: string,
    assetType: AssetType,
  ): Promise<GameAssetContainer> {
    const assetKey = `meshes/${assetType}/${assetName}`;
    const assetContainer = await LoadAssetContainerAsync(`${assetKey}.glb`, this.scene);
    return GameAssetContainer.createFromAssetContainer(assetContainer);
  }

  public getTexture(name: string): Texture {
    return new Texture(`img/textures/${name}.png`, this.scene);
  }

  public async instantiateUnityScene(sceneName: string): Promise<UnityScene> {
    const gameAssetContainer = await this.loadGameAssetContainer(
      sceneName,
      AssetType.SCENE,
    );
    const spawnTriggers: SpawnTrigger[] = [];
    let arrivalPoint: TransformNode | undefined = undefined;

    const rootMesh = gameAssetContainer.addAssetsToScene();

    rootMesh.getDescendants().forEach((node) => {
      const name = node.name;

      const match = name.match(/#[A-Z]+(-[A-Z0-9]+)*#/);
      if (!match) return;

      const tokens = match[0].slice(1, -1).split('-');
      const type = tokens[0];

      if (
        type === UnityTypeToken.PHYSICAL_OBJECT &&
        (node instanceof Mesh || node instanceof InstancedMesh)
      ) {
        this.handlePhysicalObject(node, tokens, gameAssetContainer);
      } else if (type === UnityTypeToken.ARRIVAL_POINT) {
        arrivalPoint = this.handleArrivalPoint(node as Mesh);
      } else if (type === UnityTypeToken.SPAWN_TRIGGER) {
        this.handleSpawnTrigger(node as Mesh, spawnTriggers, tokens);
      }
    });

    return {
      container: gameAssetContainer,
      rootMesh: rootMesh,
      spawnTriggers: spawnTriggers,
      arrivalPoint: arrivalPoint,
    };
  }

  private handlePhysicalObject(
    node: Mesh | InstancedMesh,
    tokens: string[],
    gameAssetContainer: GameAssetContainer,
  ): void {
    const shape = tokens[1];

    let physicsAggregate!: PhysicsAggregate;

    if (shape === UnityPhysicShapeToken.BOX) {
      physicsAggregate = new PhysicsAggregate(node, PhysicsShapeType.BOX, {
        mass: 0,
      });
    } else if (shape === UnityPhysicShapeToken.CONVEX_HULL) {
      physicsAggregate = new PhysicsAggregate(node, PhysicsShapeType.CONVEX_HULL, {
        mass: 0,
      });
    } else if (shape === UnityPhysicShapeToken.MESH) {
      physicsAggregate = new PhysicsAggregate(node, PhysicsShapeType.MESH, {
        mass: 0,
      });
    }
    gameAssetContainer.addPhysicsAggregate(physicsAggregate);
  }

  private handleArrivalPoint(node: Mesh): TransformNode {
    node.position.x *= -1;
    return node;
  }

  private handleSpawnTrigger(
    node: Mesh,
    spawnTriggers: SpawnTrigger[],
    tokens: string[],
  ): void {
    const diameter = parseInt(tokens[1]);
    node.position.x *= -1;

    const spawnPoints: TransformNode[] = [];
    node.getChildTransformNodes(true).forEach((child) => {
      child.position.x *= -1;
      spawnPoints.push(child);
    });

    spawnTriggers.push(
      new SpawnTrigger(this.scene, diameter, node.absolutePosition, spawnPoints),
    );
  }
}
