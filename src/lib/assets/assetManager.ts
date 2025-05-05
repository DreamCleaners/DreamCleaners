import {
  Color3,
  HDRCubeTexture,
  InstancedMesh,
  LoadAssetContainerAsync,
  Mesh,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  Scene,
  StandardMaterial,
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
    // Create the skybox
    this.createSky(sceneName, gameAssetContainer);

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

  private createSky(sceneName: string, assetContainer: GameAssetContainer): void {
    const skybox = MeshBuilder.CreateBox('skyBox', { size: 1000 }, this.scene);

    // Create material for the skybox
    const skyboxMaterial = new StandardMaterial(sceneName + 'Sky', this.scene);
    skyboxMaterial.backFaceCulling = false;

    const hdrTexture = new HDRCubeTexture(
      `materials/${sceneName}Sky.hdr`,
      this.scene,
      512,
    );

    skyboxMaterial.reflectionTexture = hdrTexture;
    skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
    skyboxMaterial.specularColor = new Color3(0, 0, 0);
    skyboxMaterial.disableLighting = true;

    skybox.material = skyboxMaterial;
    skybox.infiniteDistance = true;

    assetContainer.addMesh(skybox);
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
    return node;
  }

  private handleSpawnTrigger(
    node: Mesh,
    spawnTriggers: SpawnTrigger[],
    tokens: string[],
  ): void {
    const diameter = parseInt(tokens[1]);

    const spawnPoints: TransformNode[] = [];
    node.getChildTransformNodes(true).forEach((child) => {
      spawnPoints.push(child);
    });

    spawnTriggers.push(
      new SpawnTrigger(this.scene, diameter, node.absolutePosition, spawnPoints),
    );
  }
}
