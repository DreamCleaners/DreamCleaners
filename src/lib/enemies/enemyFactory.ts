import { InstantiatedEntries, Vector3 } from '@babylonjs/core';
import { AssetType } from '../assets/assetType';
import { GameAssetContainer } from '../assets/gameAssetContainer';
import { Game } from '../game';
import { Enemy } from './enemy';
import { EnemyType } from './enemyType';
import { GameScene } from '../scenes/gameScene';
import { EnemyDataManager } from './enemyDataManager';

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

  public async preloadEnemyAssets(enemyTypes: EnemyType[], game: Game): Promise<void> {
    const preloadPromises = enemyTypes.map(async (enemyType) => {
      if (this.gameAssetContainerCache.has(enemyType)) {
        return; // Skip if already preloaded
      }

      const gameAssetContainer = await game.assetManager.loadGameAssetContainer(
        enemyType,
        AssetType.CHARACTER,
      );

      this.gameAssetContainerCache.set(enemyType, gameAssetContainer);
    });

    await Promise.all(preloadPromises);
  }

  /**
   * Clones the enemy assets to the scene and returns the instantiated entries
   */
  private async getEnemyEntries(enemyType: EnemyType): Promise<InstantiatedEntries> {
    const gameAssetContainer = this.gameAssetContainerCache.get(enemyType);

    if (!gameAssetContainer) {
      throw new Error(`No game asset container found for enemy type: ${enemyType}`);
    }

    return gameAssetContainer.cloneAssetsToScene();
  }

  public async createEnemy(
    enemyType: EnemyType,
    difficultyFactor: number,
    gameScene: GameScene,
    position: Vector3,
  ): Promise<Enemy> {
    const entries = await this.getEnemyEntries(enemyType);
    const enemyData = EnemyDataManager.getInstance().getEnemyData(enemyType);

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
