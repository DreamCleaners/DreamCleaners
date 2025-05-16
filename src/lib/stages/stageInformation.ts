import { EnemyType } from '../enemies/enemyType';
import { FixedStageLayout } from '../scenes/fixedStageLayout';
import { StageReward } from './stageReward';

/** Contains basic information on a stage, its particularities (type of enemies and so on)
 * as well as the reward linked to it
 */
export class StageInformation {
  public isStageProcedural = false;
  // The proposed stage layout, null if procedural
  public proposedFixedStageLayout: FixedStageLayout | null = null;
  public difficulty = 1;
  public enemyTypes: EnemyType[] = [];

  public stageReward!: StageReward;

  public description: string = '';

  constructor(
    isStageProcedural: boolean,
    proposedFixedStageLayout: FixedStageLayout | null,
    difficulty: number,
    enemyTypes: EnemyType[],
    stageReward: StageReward,
    description: string,
  ) {
    this.isStageProcedural = isStageProcedural;
    this.proposedFixedStageLayout = proposedFixedStageLayout;
    this.difficulty = difficulty;
    this.enemyTypes = enemyTypes;
    this.stageReward = stageReward;
    this.description = description;
  }
}
