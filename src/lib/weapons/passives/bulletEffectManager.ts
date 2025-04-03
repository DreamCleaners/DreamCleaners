import { Enemy } from '../../enemies/enemy';
import { BulletEffect } from './bulletEffect';

/** This object is carried by the enemies and used to monitor and apply all
 * effects received from the player weapon bullets
 */
export class BulletEffectManager {
  public effectsInAction: Map<BulletEffectType, BulletEffect> = new Map<
    BulletEffectType,
    BulletEffect
  >();
  private initialEnemySpeed!: number;

  constructor(public enemy: Enemy) {
    this.initialEnemySpeed = enemy.SPEED;
  }

  public applyEffect(bulletEffect: BulletEffect) {
    // We push to effects in action this effect with the starting time
    if (!this.effectsInAction.has(bulletEffect.effectType)) {
      this.effectsInAction.set(bulletEffect.effectType, bulletEffect);
      bulletEffect.startTime = Date.now();
    } else {
      // Enemy got hit by an effect it already has or had
      // We update the effect start time
      this.effectsInAction.get(bulletEffect.effectType)!.startTime = Date.now();
    }
  }

  /** Updates effects applied to the enemy, for example calculates if the effect duration
   * is over and removes the effect from the enemy.
   */
  public update() {
    // We iterate over all the effects and manage them
    for (const [effectType, effect] of this.effectsInAction.entries()) {
      // We check if the effect duration is over
      const elapsedTime = (Date.now() - effect.startTime) / 1000;
      if (elapsedTime >= effect.duration) {
        // Effect is over
        this.endEffect(effectType);
      } else {
        // Check if one second has passed since the last action
        const elapsedSinceLastAct = (Date.now() - effect.lastActTime) / 1000;
        if (elapsedSinceLastAct >= 1) {
          this.actEffect(effectType, effect.value);
          // Update the lastActTime
          effect.lastActTime = Date.now();
        }
      }
    }
  }

  /** According to the effect, ends the effect and takes action (deal damage for burn ...) */
  private endEffect(effectType: BulletEffectType) {
    // We check if the effect was a slow effect and we reset the speed to the initial value
    if (effectType == BulletEffectType.SLOW) {
      this.enemy.updateSpeed(this.initialEnemySpeed);
    }
  }

  /** According to the effect, updates the effect and takes action (deal damage for burn ...) */
  private actEffect(effectType: BulletEffectType, value: number) {
    if (effectType == BulletEffectType.BURN) {
      this.enemy.takeDamage(value);
    } else if (effectType == BulletEffectType.SLOW) {
      this.enemy.updateSpeed(this.initialEnemySpeed * (1 - value));
    }
  }
}

export enum BulletEffectType {
  SLOW,
  BURN,
}
