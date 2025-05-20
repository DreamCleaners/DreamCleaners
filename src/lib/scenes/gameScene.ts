import { Scene, Vector3 } from '@babylonjs/core';
import { Game } from '../game';
import { EnemyFactory } from '../enemies/enemyFactory';
import { GameAssetContainer } from '../assets/gameAssetContainer';
import { NavigationManager } from '../navigationManager';
import { StageInformation } from '../stages/stageInformation';
import { ProceduralOptions } from './stageData';
import { AssetType } from '../assets/assetType';
import { StageLayout } from './stageLayout';
import { UnityScene } from '../assets/unityScene';
import { randomInt } from '../utils/random';

export abstract class GameScene {
  public scene: Scene;
  public navigationManager!: NavigationManager;
  protected enemyFactory!: EnemyFactory;

  public gameAssetContainer!: GameAssetContainer;

  // The specificities of the stage linked to this scene
  public stageInfo!: StageInformation;

  protected unityScene!: UnityScene;

  constructor(
    public game: Game,
    protected stageLayout: StageLayout,
  ) {
    this.scene = game.scene;
    this.enemyFactory = EnemyFactory.getInstance();
  }

  public abstract load(): Promise<void>;

  /**
   * Dispose of any resources used by the scene.
   */
  public dispose(): void {
    this.unityScene.rootMesh.dispose();
    this.unityScene.arrivalPoint?.dispose();
    this.unityScene.spawnTriggers.forEach((spawnTrigger) => {
      spawnTrigger.dispose();
    });
    this.unityScene.container.dispose();

    this.gameAssetContainer.dispose();
    this.navigationManager.dispose();
  }

  public update(): void {}

  public fixedUpdate(): void {}

  protected async loadFixedStageContainer(): Promise<GameAssetContainer> {
    return await this.game.assetManager.loadGameAssetContainer(
      this.stageLayout,
      AssetType.SCENE,
    );
  }

  protected async loadProceduralStageContainer(
    proceduralOptions: ProceduralOptions,
  ): Promise<GameAssetContainer> {
    const unityProceduralScene =
      await this.game.assetManager.loadProceduralSceneFromUnity(this.stageLayout);

    unityProceduralScene.spawnRoom.position = new Vector3(0, 0, 0);
    unityProceduralScene.link.position = this.game.assetManager
      .getAnchor(unityProceduralScene.spawnRoom)
      .absolutePosition.clone();

    let currentAnchor = this.game.assetManager.getAnchor(unityProceduralScene.link);

    const rooms = unityProceduralScene.rooms;

    for (let i = 0; i < proceduralOptions.roomsToGenerate; i++) {
      // get a random room and remove it from the list
      const randomIndex = randomInt(0, rooms.length - 1);
      const room = rooms[randomIndex];
      rooms.splice(randomIndex, 1);

      room.position = currentAnchor.absolutePosition.clone();

      const link = unityProceduralScene.link.clone('link', room.parent);
      if (!link) throw new Error('Could not clone link');

      unityProceduralScene.container.addTransformNode(link);
      link.setAbsolutePosition(
        this.game.assetManager.getAnchor(room).absolutePosition.clone(),
      );

      currentAnchor = this.game.assetManager.getAnchor(link);
    }

    unityProceduralScene.endRoom.setAbsolutePosition(
      currentAnchor.absolutePosition.clone(),
    );

    return unityProceduralScene.container;
  }

  public setStageInformation(stageInfo: StageInformation): void {
    this.stageInfo = stageInfo;
  }
}
