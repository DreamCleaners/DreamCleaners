import { AnimationOptions } from '../animations/animationOptions';
import { Vec2 } from '../utils/jsonTypes';

export type EnemyData = {
  name: string;
  baseStats: BaseEnemyStats;
  meshData: EnemyMesh;
  attackAnimation: EnemyAnimationData;
  walkAnimation: EnemyAnimationData;
  idleAnimation: EnemyAnimationData;
};

export type BaseEnemyStats = {
  attackRange: number;
  attackSpeed: number;
  speed: number;
  attackDamage: number;
  health: number;
};

export type EnemyMesh = {
  radius: number;
  height: number;
  scale: number;
  hitboxOffset: Vec2;
};

export type EnemyAnimationData = {
  name: string;
  options: AnimationOptions;
};
