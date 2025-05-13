import data from '../../assets/data/enemies.json' assert { type: 'json' };
import { EnemyData } from './enemyData';

export class EnemyDataManager {
  private enemiesData = new Map<string, EnemyData>();

  constructor() {
    const enemiesJson = data as Record<string, EnemyData>;
    for (const enemyType in enemiesJson) {
      const enemyJson = enemiesJson[enemyType];
      this.enemiesData.set(enemyType, enemyJson);
    }
  }

  public getEnemyData(enemyType: string): EnemyData {
    const enemyData = this.enemiesData.get(enemyType);
    if (!enemyData) {
      throw new Error(`Enemy type ${enemyType} not found`);
    }

    return structuredClone(enemyData); // Return a deep copy of the enemy data
  }
}
