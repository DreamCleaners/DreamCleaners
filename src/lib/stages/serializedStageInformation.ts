import { EnemyType } from '../enemies/enemyType';
import { FixedStageLayout } from '../scenes/fixedStageLayout';
import { RewardWeaponDescription } from './rewardWeaponDescription';

export interface SerializedStageReward {
  moneyReward: number;
  weaponReward: RewardWeaponDescription | null;
}

export interface SerializedStageInformation {
  isStageProcedural: boolean;
  proposedFixedStageLayout: FixedStageLayout | null;
  difficulty: number;
  enemyTypes: EnemyType[];
  stageReward: SerializedStageReward;
}
