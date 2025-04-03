import { ISaveable } from '../saveable';
import { Weapon } from '../weapons/weapon';
import { Rarity } from '../shop/rarity.ts';
import { WeaponSerializedData } from '../weapons/weaponSerializedData';
import { WeaponType } from '../weapons/weaponType';
import { Player } from './player';
import { PlayerPassiveItem } from '../shop/playerPassiveItem.ts';
import { SerializedPlayerInventory } from './serializedPlayerInventory.ts';

/** Purely a storage class for the player weapons */
export class PlayerInventory implements ISaveable {
  private weapons: Weapon[] = [];
  private playerPassives: PlayerPassiveItem[] = [];

  constructor(private player: Player) {}

  save(): string {
    // Serialize the weapons array into a JSON string
    const weaponsSerializedData: WeaponSerializedData[] = this.weapons.map((weapon) =>
      weapon.serialize(),
    );

    const playerPassivesSerializedData = this.playerPassives.map(
      (passive) => passive.playerPassiveType,
    );

    return JSON.stringify({
      weapons: weaponsSerializedData,
      playerPassives: playerPassivesSerializedData,
    } as SerializedPlayerInventory);
  }

  restoreSave(data: string): void {
    const parsedData: SerializedPlayerInventory = JSON.parse(data);

    // deserialize player passives
    this.playerPassives = parsedData.playerPassives.map((passive) =>
      this.player.game.playerPassiveFactory.createPlayerPassive(passive),
    );

    // dispose every weapon in the inventory in case we don't refresh the browser
    this.weapons.forEach((weapon) => {
      weapon.dispose();
    });

    // deserialize weapons
    this.weapons = parsedData.weapons.map((weaponJson) =>
      Weapon.deserialize(weaponJson, this.player),
    );
  }

  resetSave(): void {
    this.weapons = [];
    const weapon = new Weapon(this.player, WeaponType.GLOCK, Rarity.COMMON);
    this.addWeaponToInventory(weapon);

    // We also reset the player passives
    this.playerPassives = [];
  }

  // --------------------- Weapons ---------------------------
  // ---------------------------------------------------------

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

  // ----------------- Player passives -----------------------
  // ---------------------------------------------------------

  public getPlayerPassives(): PlayerPassiveItem[] {
    return this.playerPassives;
  }

  public addPlayerPassiveItem(item: PlayerPassiveItem): void {
    this.playerPassives.push(item);
    item.apply();
  }
}
