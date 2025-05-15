import { InstantiatedEntries, Vector3 } from '@babylonjs/core';
import { AssetType } from '../assets/assetType';
import { GameAssetContainer } from '../assets/gameAssetContainer';
import { Game } from '../game';
import { Enemy } from './enemy';
import { EnemyType } from './enemyType';
import { GameScene } from '../scenes/gameScene';

// Singleton
export class EnemyFactory {
  private static instance: EnemyFactory;

  private gameAssetContainerCache: Map<EnemyType, GameAssetContainer> = new Map();

  private constructor() {}

  public static getInstance(): EnemyFactory {
    if (!EnemyFactory.instance) {
      EnemyFactory.instance = new EnemyFactory();
    }

    return EnemyFactory.instance;
  }

  /**
   * Clones the enemy assets to the scene and returns the instantiated entries
   */
  private async getEnemyEntries(
    enemyType: EnemyType,
    game: Game,
  ): Promise<InstantiatedEntries> {
    let gameAssetContainer = this.gameAssetContainerCache.get(enemyType);

    if (!gameAssetContainer) {
      gameAssetContainer = await game.assetManager.loadGameAssetContainer(
        enemyType,
        AssetType.CHARACTER,
      );
      this.gameAssetContainerCache.set(enemyType, gameAssetContainer);
    }

    return gameAssetContainer.cloneAssetsToScene();
  }

  public async createEnemy(
    enemyType: EnemyType,
    difficultyFactor: number,
    gameScene: GameScene,
    position: Vector3,
  ): Promise<Enemy> {
    const entries = await this.getEnemyEntries(enemyType, gameScene.game);
    const enemyData = gameScene.game.enemyDataManager.getEnemyData(enemyType);

    return new Enemy(
      gameScene,
      difficultyFactor,
      entries,
      position,
      enemyData,
      enemyType,
    );
  }
}
