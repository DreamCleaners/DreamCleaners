import { BulletEffectType } from './bulletEffectManager';

export class BulletEffect {
  public effectType: BulletEffectType;
  public value: number; // Value of the effect, for example the amount of slow or burn damage per second
  public duration: number; // Duration of the effect in seconds
  public startTime: number; // Time when the effect was applied
  public lastActTime: number;

  constructor(effectType: BulletEffectType, value: number, duration: number) {
    this.effectType = effectType;
    this.value = value;
    this.duration = duration;
    this.startTime = null!;
    this.lastActTime = 0;
  }
}
