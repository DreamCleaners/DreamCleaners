import {
  Color3,
  HDRCubeTexture,
  InstancedMesh,
  LoadAssetContainerAsync,
  Mesh,
  MeshBuilder,
  Node,
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
import {
  UnityPhysicShapeToken,
  UnityProceduralGenerationToken,
  UnityTypeToken,
} from './unityTokens';
import { UnityScene } from './unityScene';
import { SpawnTrigger } from '../stages/spawnTrigger';
import { UnityProceduralScene } from './unityProceduralScene';
import { ColliderMask } from '../colliderMask';

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

  private getTokens(node: Node): string[] {
    const name = node.name;
    const match = name.match(/#[A-Z]+(-[A-Z0-9]+)*#/);
    if (!match) return [];

    return match[0].slice(1, -1).split('-');
  }

  public async instantiateUnityScene(
    gameAssetContainer: GameAssetContainer,
    sceneName: string,
  ): Promise<UnityScene> {
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
      } else if (
        type === UnityTypeToken.INVISIBLE_OBJECT &&
        (node instanceof Mesh || node instanceof InstancedMesh)
      ) {
        this.handlePhysicalObject(node, tokens, gameAssetContainer, false);
      }
    });

    return {
      container: gameAssetContainer,
      rootMesh: rootMesh,
      spawnTriggers: spawnTriggers,
      arrivalPoint: arrivalPoint,
    };
  }

  /**
   * Load all necessary elements to create a procedural scene
   * This method does not instantiate the scene, it only loads the assets
   */
  public async loadProceduralSceneFromUnity(
    sceneName: string,
  ): Promise<UnityProceduralScene> {
    const gameAssetContainer = await this.loadGameAssetContainer(
      sceneName,
      AssetType.SCENE,
    );

    const rootMesh = gameAssetContainer.getRootMesh();

    let spawnRoom!: Mesh;
    let endRoom!: Mesh;
    let link!: Mesh;
    const rooms: Mesh[] = [];

    rootMesh.getDescendants().forEach((node) => {
      const tokens = this.getTokens(node);
      const type = tokens[0];

      if (type !== UnityTypeToken.PROCEDURAL_GENERATION) return;

      if (tokens[1] === UnityProceduralGenerationToken.SPAWN) {
        spawnRoom = node as Mesh;
      } else if (tokens[1] === UnityProceduralGenerationToken.END) {
        endRoom = node as Mesh;
      } else if (tokens[1] === UnityProceduralGenerationToken.LINK) {
        link = node as Mesh;
      } else if (tokens[1] === UnityProceduralGenerationToken.ROOM) {
        rooms.push(node as Mesh);
      }
    });

    return {
      spawnRoom: spawnRoom,
      endRoom: endRoom,
      link: link,
      rooms: rooms,
      rootMesh: rootMesh,
      container: gameAssetContainer,
    };
  }

  public getAnchor(node: TransformNode): Mesh {
    const anchor = node.getDescendants().find((child) => {
      const tokens = this.getTokens(child);
      return (
        tokens[0] === UnityTypeToken.PROCEDURAL_GENERATION &&
        tokens[1] === UnityProceduralGenerationToken.ANCHOR
      );
    });

    if (!anchor) {
      throw new Error(`Anchor not found for node ${node.name}`);
    }

    return anchor as Mesh;
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
    isVisible: boolean = true,
  ): void {
    node.isVisible = isVisible;

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

    if (!isVisible) {
      physicsAggregate.shape.filterMembershipMask = ColliderMask.OBJECT;
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
