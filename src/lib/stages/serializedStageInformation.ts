import { EnemyType } from '../enemies/enemyType';
import { StageLayout } from '../scenes/stageLayout';
import { RewardWeaponDescription } from './rewardWeaponDescription';

export interface SerializedStageReward {
  moneyReward: number;
  weaponReward: RewardWeaponDescription | null;
}

export interface SerializedStageInformation {
  proposedStageLayout: StageLayout;
  difficulty: number;
  enemyTypes: EnemyType[];
  stageReward: SerializedStageReward;
  description: string;
}
