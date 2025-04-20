import { EnemyType } from '../enemies/enemyType';
import { FixedStageLayout } from '../scenes/fixedStageLayout';

export class StageInformationManager {
  public getStageImagePath(stageName: string): string {
    return `img/stage-images/${stageName}.png`;
  }

  public getStageName(stageLayout: FixedStageLayout) {
    switch (stageLayout) {
      case FixedStageLayout.LABORATORY:
        return 'Laboratory';
      case FixedStageLayout.OPEN_FARM:
        return 'Farm';
      default:
        return 'Unknown Stage';
    }
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
