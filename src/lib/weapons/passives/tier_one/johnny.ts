import { Weapon } from '../../weapon';
import { BulletEffect } from '../bulletEffect';
import { BulletEffectType } from '../bulletEffectManager';
import { WeaponPassive } from '../weaponPassive';
import { WeaponPassiveType, WeaponPassiveT1 } from '../weaponPassivesManager';

export class Johnny extends WeaponPassive {
  public name: string = 'Johnny';
  private readonly FIRE_DAMAGE_PER_SECOND: number = 10;
  private readonly FIRE_DURATION: number = 3;
  public description: string =
    'Weapon ignites enemies on hit, dealing ' +
    this.FIRE_DAMAGE_PER_SECOND +
    ' damage per second for ' +
    this.FIRE_DURATION +
    ' seconds.';

  public enumName: WeaponPassiveType = WeaponPassiveT1.JOHNNY;

  public override embedPassiveToWeapon(weapon: Weapon): void {
    // We apply the passive to the player's weapon by modifying adding to the
    // weapon a bullet effect that burn enemies
    super.embedPassiveToWeapon(weapon);
    weapon.bulletEffects.push(
      new BulletEffect(
        BulletEffectType.BURN,
        this.FIRE_DAMAGE_PER_SECOND,
        this.FIRE_DURATION,
      ),
    );
  }
}
