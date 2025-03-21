import {
  InstancedMesh,
  InstantiatedEntries,
  LoadAssetContainerAsync,
  Mesh,
  PhysicsAggregate,
  PhysicsShapeType,
  Scene,
  Vector3,
} from '@babylonjs/core';
import '@babylonjs/loaders';
import { AssetType } from './assetType';
import { WeaponData } from '../weapons/weaponData';
import { GameAssetContainer } from './gameAssetContainer';
import { UnityPhysicShapeToken, UnityTypeToken } from './unityTokens';

export class AssetManager {
  private loadedContainers: Map<string, GameAssetContainer> = new Map();
  private loadedWeaponJsons: Map<string, WeaponData> = new Map();

  constructor(private scene: Scene) {}

  private getAssetKey(assetName: string, assetType: AssetType): string {
    return `meshes/${assetType}/${assetName}`;
  }

  /**
   * Load an asset container from the server or cache
   */
  public async loadAsset(
    assetName: string,
    assetType: AssetType,
  ): Promise<GameAssetContainer> {
    const assetKey = this.getAssetKey(assetName, assetType);

    let gameAssetContainer = this.loadedContainers.get(assetKey);
    if (!gameAssetContainer) {
      const assetContainer = await LoadAssetContainerAsync(`${assetKey}.glb`, this.scene);
      gameAssetContainer = GameAssetContainer.createFromAssetContainer(assetContainer);
      this.loadedContainers.set(assetKey, gameAssetContainer);
    }

    return gameAssetContainer;
  }

  /**
   * Dispose the asset container from the scene
   */
  public unloadAsset(assetName: string, assetType: AssetType): void {
    const assetKey = this.getAssetKey(assetName, assetType);
    const gameAssetContainer = this.loadedContainers.get(assetKey);
    if (!gameAssetContainer) {
      throw new Error(`Asset container not found for asset: ${assetKey}`);
    }
    gameAssetContainer.dispose();
  }

  /**
   * Remove the container from the cache and dispose it from the scene
   */
  public deleteAsset(assetName: string, assetType: AssetType): void {
    this.unloadAsset(assetName, assetType);

    const assetKey = this.getAssetKey(assetName, assetType);
    this.loadedContainers.delete(assetKey);
  }

  /**
   * Load a weapon JSON file
   */
  public async loadWeaponJson(weaponName: string): Promise<WeaponData> {
    // Check if the weapon JSON is already loaded in map, if not we fetch it from public folder
    const lowerCasedWeaponName = weaponName.toLowerCase();
    let weaponJson = this.loadedWeaponJsons.get(lowerCasedWeaponName);
    if (!weaponJson) {
      try {
        const response = await fetch(`./data/stats/${lowerCasedWeaponName}.json`);
        weaponJson = (await response.json()) as WeaponData;
        this.loadedWeaponJsons.set(lowerCasedWeaponName, weaponJson);
      } catch (error) {
        console.error(`Failed to load weapon JSON: ${weaponName} ` + error);
        throw error;
      }
    }
    return weaponJson;
  }

  public async instantiateAsset(
    assetName: string,
    assetType: AssetType,
  ): Promise<InstantiatedEntries> {
    const gameAssetContainer = await this.loadAsset(assetName, assetType);
    return gameAssetContainer.instantiateModelsToScene();
  }

  public async instantiateSceneFromUnity(
    sceneName: string,
  ): Promise<InstantiatedEntries> {
    const gameAssetContainer = await this.loadAsset(sceneName, AssetType.SCENE);
    const entries = gameAssetContainer.instantiateModelsToScene();

    const scene = entries.rootNodes[0] as Mesh;
    scene.position = new Vector3(0, 0, 0);

    scene.getDescendants().forEach((node) => {
      const name = node.name;

      const match = name.match(/#[A-Z]+(-[A-Z]+)*#/);
      if (!match) return;

      const tokens = match[0].slice(1, -1).split('-');
      const type = tokens[0];

      if (
        type === UnityTypeToken.PHYSICAL_OBJECT &&
        (node instanceof Mesh || node instanceof InstancedMesh)
      ) {
        this.handlePhysicalObject(node, tokens, gameAssetContainer);
      } else if (type === UnityTypeToken.SPAWN_POINT) {
        this.handleSpawnPoint(node as Mesh);
      }
    });

    return entries;
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

  private handleSpawnPoint(node: Mesh): void {
    node.position.x *= -1;
  }
}
