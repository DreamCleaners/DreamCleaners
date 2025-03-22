import {
  InstancedMesh,
  Light,
  LoadAssetContainerAsync,
  Mesh,
  PhysicsAggregate,
  PhysicsShapeType,
  Scene,
} from '@babylonjs/core';
import '@babylonjs/loaders';
import { AssetType } from './assetType';
import { WeaponData } from '../weapons/weaponData';
import { GameAssetContainer } from './gameAssetContainer';
import { UnityPhysicShapeToken, UnityTypeToken } from './unityTokens';
import { UnityScene } from './unityScene';

export class AssetManager {
  private loadedWeaponJsons: Map<string, WeaponData> = new Map();

  constructor(private scene: Scene) {}

  public async loadGameAssetContainer(
    assetName: string,
    assetType: AssetType,
  ): Promise<GameAssetContainer> {
    const assetKey = `meshes/${assetType}/${assetName}`;
    const assetContainer = await LoadAssetContainerAsync(`${assetKey}.glb`, this.scene);
    return GameAssetContainer.createFromAssetContainer(assetContainer);
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

  public async instantiateUnityScene(sceneName: string): Promise<UnityScene> {
    const gameAssetContainer = await this.loadGameAssetContainer(
      sceneName,
      AssetType.SCENE,
    );
    const spawnPoints: Mesh[] = [];

    const rootMesh = gameAssetContainer.addAssetsToScene();

    rootMesh.getDescendants().forEach((node) => {
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
        this.handleSpawnPoint(node as Mesh, spawnPoints);
      } else if (type === UnityTypeToken.LIGHT) {
        this.handleLight(node as Light);
      }
    });

    return {
      container: gameAssetContainer,
      rootMesh: rootMesh,
      spawnPoints: spawnPoints,
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

  private handleSpawnPoint(node: Mesh, spawnPoints: Mesh[]): void {
    console.log('Spawn point found');
    node.position.x *= -1;
    spawnPoints.push(node);
  }

  private handleLight(node: Light): void {
    node.intensity *= 10;
  }
}
