import { InstantiatedEntries, Vector3 } from '@babylonjs/core';
import { AssetType } from '../assets/assetType';
import { GameAssetContainer } from '../assets/gameAssetContainer';
import { Game } from '../game';
import { Enemy } from './enemy';
import { EnemyType } from './enemyType';
import { Zombie } from './zombie';

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
    game: Game,
    position: Vector3,
  ): Promise<Enemy> {
    const entries = await this.getEnemyEntries(enemyType, game);

    switch (enemyType) {
      case EnemyType.ZOMBIE:
        return new Zombie(game, difficultyFactor, position, entries);
      default:
        throw new Error('Unknown enemy type');
    }
  }
}
