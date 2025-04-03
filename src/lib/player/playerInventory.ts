import { ISaveable } from '../saveable';
import { Weapon } from '../weapons/weapon';
import { Rarity } from '../shop/rarity.ts';
import { WeaponSerializedData } from '../weapons/weaponSerializedData';
import { WeaponType } from '../weapons/weaponType';
import { Player } from './player';
import { PlayerPassiveItem } from '../shop/playerPassiveItem.ts';
import { SerializedPlayerInventory } from './serializedPlayerInventory.ts';
import {
  WeaponPassivesManager,
  WeaponPassiveT1,
} from '../weapons/passives/weaponPassivesManager.ts';

/** Purely a storage class for the player weapons */
export class PlayerInventory implements ISaveable {
  private weapons: Array<Weapon> = [];
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

    // deserialize weapons
    this.weapons = parsedData.weapons.map((weaponJson) =>
      Weapon.deserialize(weaponJson, this.player),
    );
  }

  resetSave(): void {
    // Base weapon is by default a common shotgun
    this.weapons = [];
    const weapon = new Weapon(this.player, WeaponType.SHOTGUN, Rarity.COMMON);

    this.addWeaponToInventory(weapon);
    WeaponPassivesManager.getInstance().applyPassiveToWeapon(
      weapon,
      WeaponPassiveT1.JOHNNY,
    );

    WeaponPassivesManager.getInstance().applyPassiveToWeapon(
      weapon,
      WeaponPassiveT1.SNAIL,
    );

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
