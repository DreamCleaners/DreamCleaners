import { Weapon } from '../../weapon';
import { BulletEffect } from '../bulletEffect';
import { BulletEffectType } from '../bulletEffectManager';
import { WeaponPassive } from '../weaponPassive';
import { WeaponPassiveType, WeaponPassiveT1 } from '../weaponPassivesManager';

export class Snail extends WeaponPassive {
  public name: string = 'Snail';
  private readonly SLOW_AMOUNT: number = 0.4;
  private readonly SLOW_DURATION: number = 1.5; // 1.5 seconds
  public description: string =
    'Weapon now slows enemies by ' +
    this.SLOW_AMOUNT * 100 +
    '% for ' +
    this.SLOW_DURATION +
    ' seconds.';

  public enumName: WeaponPassiveType = WeaponPassiveT1.SNAIL;

  public override embedPassiveToWeapon(weapon: Weapon): void {
    // We apply the passive to the player's weapon by modifying the weapon's crit chance modifier
    super.embedPassiveToWeapon(weapon);
    weapon.bulletEffects.push(
      new BulletEffect(BulletEffectType.SLOW, this.SLOW_AMOUNT, this.SLOW_DURATION),
    );
    console.log('Applying ', this.name, ' to weapon ', weapon.weaponType);
    console.log('Description: ', this.description);
  }
}
