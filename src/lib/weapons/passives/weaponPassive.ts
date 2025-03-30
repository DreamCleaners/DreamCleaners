import { Weapon } from '../weapon';

export abstract class WeaponPassive {
  public abstract name: string;
  public abstract description: string;
  public abstract enumName: WeaponPassiveType;

  public embedPassiveToWeapon(weapon: Weapon): void {
    weapon.embeddedPassives.push(this.enumName);
  }
}

export enum WeaponPassiveType {
  LUCKY_SHOT,
}
