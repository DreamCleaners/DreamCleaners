import { EnemyType } from '../enemies/enemyType';
import { StageLayout } from '../scenes/stageLayout';
import { StageReward } from './stageReward';

/** Contains basic information on a stage, its particularities (type of enemies and so on)
 * as well as the reward linked to it
 */
export class StageInformation {
  public stageLayout: StageLayout;
  public difficulty = 1;
  public enemyTypes: EnemyType[] = [];

  public stageReward!: StageReward;

  public description: string = '';

  constructor(
    stageLayout: StageLayout,
    difficulty: number,
    enemyTypes: EnemyType[],
    stageReward: StageReward,
    description: string,
  ) {
    this.stageLayout = stageLayout;
    this.difficulty = difficulty;
    this.enemyTypes = enemyTypes;
    this.stageReward = stageReward;
    this.description = description;
  }
}
