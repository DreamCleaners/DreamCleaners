import { EnemyType } from '../enemies/enemyType';

export class StageInformationManager {
  public getStageImagePath(stageName: string): string {
    console.log('Received stage name: ', stageName);
    console.log('Returning stage image path: ', `stage-images/${stageName}.png`);
    return `img/stage-images/${stageName}.png`;
  }

  public buildStageDescription(enemies: EnemyType[]): string {
    let desc = '';
    desc += " The patient's dream is infested of ";

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      desc += `${this.enemyTypeToString(enemy)}`;
      desc += 's';
      if (i < enemies.length - 1) {
        desc += ', ';
      }
    }

    desc += '. Your job is to enter this dream and clean up everything.';

    return desc;
  }

  private enemyTypeToString(enemyType: EnemyType): string {
    return enemyType.toString();
  }
}
