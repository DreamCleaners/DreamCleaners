import { Game } from '../../game';
import { WeaponPassivesManager } from '../../weapons/passives/weaponPassivesManager';
import { Weapon } from '../../weapons/weapon';
import { Rarity } from '../rarity';

/** Responsible for handling weapon's quality upgrade logic */
export class WorkbenchManager {
  constructor(private game: Game) {
    this.game = game;
  }

  /** Increases the weapon's quality */
  public improveWeaponQuality(index: number) {
    // In fact when increasing the quality of the weapon
    // We are replacing it with a new one of higher quality
    const player = this.game.player;

    // We return if the weapon is already at max quality
    if (player.inventory.getWeapons()[index].currentRarity >= Rarity.LEGENDARY) {
      console.log("Weapon already at max quality, can't improve it");
      return;
    }
    const weapon = player.inventory.getWeapons()[index];

    weapon.currentRarity++;

    if (weapon.isAkimboWielding) {
      weapon.akimboWeapon?.hideInScene();
      weapon.akimboWeapon?.dispose();
    }

    // We must re-get the "factory setting" weapon data as passives may have altered it
    weapon.weaponData = this.game.weaponDataManager.getWeaponData(weapon.weaponType);
    weapon.applyCurrentStats();

    // Re-apply passives to the new weapon
    const pm = WeaponPassivesManager.getInstance();
    const passivesToReEmbed = weapon.embeddedPassives;

    weapon.embeddedPassives = [];

    pm.applyPassivesToWeapon(weapon, passivesToReEmbed);
  }

  /** Returns a price for upgrading the given weapon
   * The price will depend on the weapon's current quality
   * and the passives embedded
   */
  public getCostForQualityUpgrade(weapon: Weapon): number {
    // Cost logic: 400 * (current rarity + 1) + 50 * number of passives
    const baseCost = 400 * (weapon.currentRarity + 1);
    const passivesCost = 50 * weapon.embeddedPassives.length;

    return baseCost + passivesCost;
  }
}
