import { Weapon } from '../../weapon';
import { WeaponPassive } from '../weaponPassive';
import {
  WeaponPassiveType,
  WeaponPassiveT3,
  WeaponPassivesManager,
} from '../weaponPassivesManager';

export class Akimbo extends WeaponPassive {
  public name: string = 'Akimbo';
  public description: string = "You've got two hands, why not use two weapons ?";

  public enumName: WeaponPassiveType = WeaponPassiveT3.AKIMBO;

  public override embedPassiveToWeapon(weapon: Weapon): void {
    super.embedPassiveToWeapon(weapon);

    const newWeapon = new Weapon(
      weapon.player,
      weapon.weaponType,
      weapon.currentRarity,
      true,
    );

    // We will initialize the mesh but first we modify its position
    newWeapon.weaponData.transform.position.x =
      -newWeapon.weaponData.transform.position.x;

    // we also need to flip the scale of the weapon for animations
    newWeapon.weaponData.transform.scale.x = -newWeapon.weaponData.transform.scale.x;

    newWeapon.init().then(() => {
      // We force actualization of mesh visibility only if it is already visible
      if (weapon.isVisible()) {
        weapon.hideInScene();
        weapon.showInScene();
      }
    });

    const pm = WeaponPassivesManager.getInstance();

    for (const passive of weapon.embeddedPassives) {
      if (passive === WeaponPassiveT3.AKIMBO) {
        continue; // Don't apply the akimbo passive to the new weapon
      }
      pm.applyPassiveToWeapon(newWeapon, passive);
    }

    weapon.akimboWeapon = newWeapon;
    weapon.delayBetweenAlternateShots =
      weapon.weaponData.globalStats[weapon.currentRarity].cadency * 0.5;

    weapon.isAkimboWielding = true;
  }
}
