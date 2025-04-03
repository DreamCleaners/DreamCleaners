import { Observable } from '@babylonjs/core';
import { Game } from '../game';
import { Rarity } from './rarity';
import { ShopItem } from './shopItem';
import { ShopItemType } from './shopItemType';
import { WeaponItem } from './weaponItem';
import { Weapon } from '../weapons/weapon';
import { PlayerPassiveItem } from './playerPassiveItem';
import { randomFloat, randomInt } from '../utils/random';
import { PlayerPassiveType } from './playerPassiveType';
import { ISaveable } from '../saveable';
import { WeaponPassiveItem } from './weaponPassiveItem';
import {
  WeaponPassivesManager,
  WeaponPassiveT1,
  WeaponPassiveT2,
  WeaponPassiveT3,
  WeaponPassiveType,
} from '../weapons/passives/weaponPassivesManager';

export class ShopManager implements ISaveable {
  private readonly ITEM_SLOT_COUNT = 3;
  private currentShopItems: ShopItem[] = [];

  // observables
  public readonly onShopItemsChange = new Observable<ShopItem[]>();

  // reroll
  private readonly REROLL_MULTIPLIER = 1.5;
  private currentRerollCost = 100;
  private rerollCount = 0;

  // player passives
  private readonly PLAYER_PASSIVE_DROP_RATE = 0.7;
  private readonly playerPassiveItems = new Map<Rarity, PlayerPassiveItem[]>();
  private alreadyProposedPlayerPassives = new Map<Rarity, PlayerPassiveItem[]>();

  // Weapon passives
  private readonly WEAPON_PASSIVE_DROP_RATE = 0.1;

  constructor(private game: Game) {}

  /**
   * Add all the player passive items to the shop
   */
  private initPlayerPassiveItems(): void {
    const playerPassiveTypes = Object.values(PlayerPassiveType).filter(
      (value) => typeof value === 'number',
    ) as PlayerPassiveType[];

    playerPassiveTypes.forEach((passiveType) => {
      const playerPassiveItem =
        this.game.playerPassiveFactory.createPlayerPassive(passiveType);

      const playerPassiveItemArray = this.playerPassiveItems.get(
        playerPassiveItem.rarity,
      );
      if (!playerPassiveItemArray) {
        this.playerPassiveItems.set(playerPassiveItem.rarity, [playerPassiveItem]);
      } else {
        playerPassiveItemArray.push(playerPassiveItem);
      }
    });
  }

  public resetShop(): void {
    // put back the proposed items into the shop
    this.alreadyProposedPlayerPassives.forEach((proposedPlayerPassiveArray, rarity) => {
      const playerPassives = this.playerPassiveItems.get(rarity)!;
      this.playerPassiveItems.set(
        rarity,
        playerPassives.concat(proposedPlayerPassiveArray),
      );
    });
    this.alreadyProposedPlayerPassives.clear();

    // reroll cost increases linearly with the run progression for now
    const runProgression = this.game.runManager.getStageCompletedCount();
    this.currentRerollCost = 100 + runProgression * 100;
    this.rerollCount = 0;

    this.generateShopItems();
  }

  private generateShopItems(): void {
    this.currentShopItems = [];

    for (let i = 0; i < this.ITEM_SLOT_COUNT; i++) {
      const chance = randomFloat(0, 1);
      const rarity = this.getRandomRarity();

      // WeaponPassive item (10% probability)
      if (chance < this.WEAPON_PASSIVE_DROP_RATE) {
        const weaponPassiveItem = this.getRandomWeaponPassiveItem(rarity);
        if (weaponPassiveItem) {
          this.currentShopItems.push(weaponPassiveItem);
          continue;
        }
      }

      // Player passive item
      if (chance < this.PLAYER_PASSIVE_DROP_RATE) {
        const playerPassiveItem = this.getRandomPlayerPassiveItem(rarity);
        if (playerPassiveItem) {
          this.currentShopItems.push(playerPassiveItem);
          continue;
        }
      }

      // Generate a weapon item if the slot is empty
      this.currentShopItems.push(this.getRandomWeaponItem(rarity));
    }

    this.onShopItemsChange.notifyObservers(this.currentShopItems);
  }

  public getShopItems(): ShopItem[] {
    return this.currentShopItems;
  }

  public removeItemFromShop(item: ShopItem): void {
    this.currentShopItems = this.currentShopItems.filter((shopItem) => shopItem !== item);
    this.onShopItemsChange.notifyObservers(this.currentShopItems);
    this.game.saveManager.save();
  }

  private getRandomRarity(): Rarity {
    const rarityChance = randomFloat(0, 1);
    // fixed rarities drop rates for now
    if (rarityChance < 0.55) {
      return Rarity.COMMON;
    } else if (rarityChance < 0.85) {
      return Rarity.RARE;
    } else if (rarityChance < 0.95) {
      return Rarity.EPIC;
    } else {
      return Rarity.LEGENDARY;
    }
  }

  public getRerollCost(): number {
    return Math.floor(
      this.currentRerollCost * this.REROLL_MULTIPLIER ** this.rerollCount,
    );
  }

  public rerollShop(): void {
    const rerollCost = this.getRerollCost();
    const currentMoney = this.game.moneyManager.getPlayerMoney();

    if (currentMoney < rerollCost) {
      throw new Error('Not enough money to reroll the shop!');
    }

    this.game.moneyManager.removePlayerMoney(rerollCost);
    this.rerollCount++;

    this.generateShopItems();

    // the money changes so we need to save
    this.game.saveManager.save();
  }

  // ----------------- Player passives -----------------------
  // ---------------------------------------------------------

  private getRandomPlayerPassiveItem(rarity: Rarity): PlayerPassiveItem | null {
    const playerPassiveItemArray = this.playerPassiveItems.get(rarity);

    // there are no items of the current rarity
    if (!playerPassiveItemArray || playerPassiveItemArray.length === 0) {
      // try to get a proposed item of the same rarity
      const proposedPlayerPassiveItem = this.getRandomProposedPlayerPassive(rarity);
      if (proposedPlayerPassiveItem) {
        return proposedPlayerPassiveItem;
      }

      // try to get a previous rarity item
      if (rarity === Rarity.COMMON) {
        return null;
      } else {
        const previousRarity = (rarity - 1) as Rarity;
        return this.getRandomPlayerPassiveItem(previousRarity);
      }
    }

    const randomIndex = randomInt(0, playerPassiveItemArray.length - 1);
    const randomItem = playerPassiveItemArray.splice(randomIndex, 1)[0];

    // add the item to the proposed items of the same rarity
    const proposedPlayerPassiveItemArray = this.alreadyProposedPlayerPassives.get(rarity);
    if (!proposedPlayerPassiveItemArray) {
      this.alreadyProposedPlayerPassives.set(rarity, [randomItem]);
    } else {
      proposedPlayerPassiveItemArray.push(randomItem);
    }

    return randomItem;
  }

  private getRandomProposedPlayerPassive(rarity: Rarity): PlayerPassiveItem | null {
    const proposedPlayerPassiveItemArray = this.alreadyProposedPlayerPassives.get(rarity);

    if (!proposedPlayerPassiveItemArray || proposedPlayerPassiveItemArray.length === 0) {
      return null;
    }

    // filter out the items that are already in the shop
    const proposedPassives = proposedPlayerPassiveItemArray.filter(
      (item) => !this.currentShopItems.some((shopItem) => shopItem.name === item.name),
    );
    if (proposedPassives.length === 0) return null;

    const randomIndex = randomInt(0, proposedPassives.length - 1);
    const randomItem = proposedPassives[randomIndex];

    return randomItem;
  }

  public buyPlayerPassive(playerPassive: PlayerPassiveItem): void {
    this.game.moneyManager.removePlayerMoney(playerPassive.price);

    this.game.player.inventory.addPlayerPassiveItem(playerPassive);

    // remove the item from the proposed items of the same rarity
    const proposedPlayerPassiveItemArray = this.alreadyProposedPlayerPassives.get(
      playerPassive.rarity,
    );
    if (proposedPlayerPassiveItemArray) {
      const index = proposedPlayerPassiveItemArray.indexOf(playerPassive);
      if (index !== -1) {
        proposedPlayerPassiveItemArray.splice(index, 1);
      }
    }

    this.removeItemFromShop(playerPassive);
  }

  // ----------------------- Weapons -------------------------
  // ---------------------------------------------------------

  private getRandomWeaponItem(rarity: Rarity): WeaponItem {
    const weaponsData = this.game.weaponManager.getWeaponsData();
    const weaponTypes = Array.from(weaponsData.keys());

    const randomIndex = randomInt(0, weaponsData.size - 1);

    const weaponType = weaponTypes[randomIndex];
    const weaponData = weaponsData.get(weaponType)!;

    return new WeaponItem(
      weaponData.weaponName,
      'weapon description...',
      100,
      ShopItemType.WEAPON,
      rarity,
      weaponType,
    );
  }

  public async buyWeapon(weaponItem: WeaponItem, inventoryIndex: number): Promise<void> {
    this.game.moneyManager.removePlayerMoney(weaponItem.price);

    const weapon = new Weapon(this.game.player, weaponItem.weaponType, weaponItem.rarity);
    await weapon.init();
    this.game.player.inventory.replaceWeaponInInventory(weapon, inventoryIndex);

    this.removeItemFromShop(weaponItem);
  }

  // ------------------- Weapons passives --------------------
  // ---------------------------------------------------------

  private getRandomWeaponPassiveItem(rarity: Rarity): WeaponPassiveItem | null {
    let correspondingWeaponPassives: string[];

    // Determine the corresponding weapon passives based on rarity
    // Needed as the weapon passives do not use the same rarity system as the rest
    switch (rarity) {
      case Rarity.COMMON:
        correspondingWeaponPassives = Object.keys(WeaponPassiveT1);
        break;
      case Rarity.RARE:
      case Rarity.EPIC:
        correspondingWeaponPassives = Object.keys(WeaponPassiveT2);
        break;
      case Rarity.LEGENDARY:
        correspondingWeaponPassives = Object.keys(WeaponPassiveT3);
        break;
      default:
        console.log('Invalid rarity provided for weapon passive item');
        return null;
    }

    // If no passives are available for the given rarity, return null
    if (correspondingWeaponPassives.length === 0) {
      return null;
    }

    // We pick a random passive from the corresponding list
    const passiveIndex = randomInt(0, correspondingWeaponPassives.length - 1);
    const passiveType = correspondingWeaponPassives[passiveIndex] as WeaponPassiveType;

    const weaponPassivesManager = WeaponPassivesManager.getInstance();
    const prettyName = weaponPassivesManager.getPrettyPassiveName(passiveType);
    const description = weaponPassivesManager.getPassiveDescription(passiveType);

    if (rarity === Rarity.RARE) {
      // We don't want rare passives in the game.
      // Only common epic legendaries
      // This if() is not mandatory in fact, we use it in order not to have
      // The possibility of having the same weapon passive in rare and epic
      // Meaning the displayed color in shop UI can differ for the same passive
      rarity = Rarity.EPIC;
    }

    return new WeaponPassiveItem(
      prettyName,
      description,
      100,
      ShopItemType.WEAPON_PASSIVE,
      rarity,
      passiveType,
    );
  }

  public buyWeaponPassive(weaponPassive: WeaponPassiveItem, index: number): void {
    this.game.moneyManager.removePlayerMoney(weaponPassive.price);

    // We apply the passive to the desired weapon
    WeaponPassivesManager.getInstance().applyPassiveToWeapon(
      this.game.player.inventory.getWeapons()[index],
      weaponPassive.weaponPassiveType,
    );

    // For now no handling of proposed weapon passives recurrency

    // Remove the item from the shop
    this.removeItemFromShop(weaponPassive);
  }

  // --------------------- Save system -----------------------
  // ---------------------------------------------------------

  public save(): string {
    const playerPassiveTypes: PlayerPassiveType[] = [];

    this.playerPassiveItems.forEach((passives) => {
      passives.forEach((passive) => {
        playerPassiveTypes.push(passive.playerPassiveType);
      });
    });

    this.alreadyProposedPlayerPassives.forEach((passives) => {
      passives.forEach((passive) => {
        playerPassiveTypes.push(passive.playerPassiveType);
      });
    });

    return JSON.stringify(playerPassiveTypes);
  }

  public restoreSave(data: string): void {
    const parsedData: PlayerPassiveType[] = JSON.parse(data);

    parsedData.forEach((passiveType) => {
      const playerPassiveItem =
        this.game.playerPassiveFactory.createPlayerPassive(passiveType);

      const playerPassiveItemArray = this.playerPassiveItems.get(
        playerPassiveItem.rarity,
      );
      if (!playerPassiveItemArray) {
        this.playerPassiveItems.set(playerPassiveItem.rarity, [playerPassiveItem]);
      } else {
        playerPassiveItemArray.push(playerPassiveItem);
      }
    });
  }

  public resetSave(): void {
    this.playerPassiveItems.clear();
    this.alreadyProposedPlayerPassives.clear();

    this.initPlayerPassiveItems();
  }
}
