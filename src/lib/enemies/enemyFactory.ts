import { Game } from '../game';
import { Enemy } from './enemy';
import { EnemyType } from './enemyType';
import { Zombie } from './zombie';

export class EnemyFactory {
  // Singleton

  private static instance: EnemyFactory;

  private constructor() {}

  public static getInstance(): EnemyFactory {
    if (!EnemyFactory.instance) {
      EnemyFactory.instance = new EnemyFactory();
    }

    return EnemyFactory.instance;
  }

  public createEnemy(enemyType: EnemyType, game: Game): Enemy {
    switch (enemyType) {
      case EnemyType.ZOMBIE:
        return new Zombie(game);
      default:
        throw new Error('Unknown enemy type');
    }
  }
}
