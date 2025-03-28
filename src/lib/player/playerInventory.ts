import { ISaveable } from '../saveable';
import { Weapon } from '../weapons/weapon';
import { WeaponRarity } from '../weapons/weaponRarity';
import { WeaponSerializedData } from '../weapons/weaponSerializedData';
import { WeaponType } from '../weapons/weaponType';
import { Player } from './player';

/** Purely a storage class for the player weapons */
export class PlayerInventory implements ISaveable {
  private player!: Player;
  private weapons: Array<Weapon> = [];

  constructor(player: Player) {
    this.player = player;
  }

  save(): string {
    // Serialize the weapons array into a JSON string
    console.log('Saving player inventory');
    return JSON.stringify(this.weapons.map((weapon) => weapon.serialize()));
  }

  restoreSave(data: string): void {
    // Deserialize the JSON string back into the weapons array
    const weaponData: Array<WeaponSerializedData> = JSON.parse(data);
    this.weapons = weaponData.map((weaponJson) =>
      Weapon.deserialize(weaponJson, this.player),
    );
    console.log('Restored player inventory');
    console.log('Weapons: ', this.weapons);
  }

  resetSave(): void {
    console.log('Resetting player inventory');
    // Base weapon is by default a common shotgun
    this.weapons = [];
    const weapon = new Weapon(this.player, WeaponType.SHOTGUN, WeaponRarity.COMMON);
    this.addWeaponToInventory(weapon);
  }

  public addWeaponToInventory(weapon: Weapon): void {
    this.weapons.push(weapon);
  }

  public getWeapons(): Array<Weapon> {
    return this.weapons;
  }

  public replaceWeaponInInventory(weapon: Weapon, index: number): void {
    this.weapons[index] = weapon;
  }

  public getAmountOfWeapons(): number {
    return this.weapons.length;
  }
}
