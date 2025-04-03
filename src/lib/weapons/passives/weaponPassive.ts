import { Weapon } from '../weapon';
import { WeaponPassiveType } from './weaponPassivesManager';

export abstract class WeaponPassive {
  public abstract name: string;
  public abstract description: string;
  public abstract enumName: WeaponPassiveType;

  public embedPassiveToWeapon(weapon: Weapon): void {
    weapon.embeddedPassives.push(this.enumName);
    console.log('Applying ', this.name, ' to weapon ', weapon.weaponType);
    console.log('Description: ', this.description);
  }
}
