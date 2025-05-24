import { EnemyDataManager } from '../enemies/enemyDataManager';
import { EnemyType } from '../enemies/enemyType';
import stageDescriptions from '../../assets/data/stageDescriptions.json' assert { type: 'json' };

export class StageInformationManager {
  public getStageImagePath(stageName: string): string {
    return `/src/assets/img/stage-images/${stageName}.png`;
  }

  public buildStageDescription(enemies: EnemyType[]): string {
    // Create enemy list string with highlighted spans
    const enemyList = enemies
      .map((enemy, index) => {
        const enemyName = this.enemyTypeToString(enemy);
        return `<span class="enemy-highlight">${enemyName}s</span>${index < enemies.length - 1 ? ', ' : ''}`;
      })
      .join('');

    // Get a random description template from the JSON
    const templates = stageDescriptions.templates;
    const randomIndex = Math.floor(Math.random() * templates.length);
    const template = templates[randomIndex];

    // Replace the {enemies} placeholder with our enemy list
    return template.replace('{enemies}', enemyList);
  }

  private enemyTypeToString(enemyType: EnemyType): string {
    const enemyData = EnemyDataManager.getInstance().getEnemyData(enemyType);
    return enemyData.name;
  }
}
