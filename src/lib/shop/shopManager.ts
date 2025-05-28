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
import { WeaponPassiveItem } from './weaponPassiveItem';
import {
  WeaponPassivesManager,
  WeaponPassiveT1,
  WeaponPassiveT2,
  WeaponPassiveT3,
  WeaponPassiveType,
} from '../weapons/passives/weaponPassivesManager';

export class ShopManager {
  private readonly ITEM_SLOT_COUNT = 3;
  private currentShopItems: ShopItem[] = [];

  // observables
  public readonly onShopItemsChange = new Observable<ShopItem[]>();
  public readonly onChancePercentageChange = new Observable<number>();

  // reroll
  private readonly BONUS_COST_PER_REROLL = 50;
  private currentRerollCost = 100;
  private rerollCount = 0;

  // player passives
  private readonly PLAYER_PASSIVE_DROP_RATE = 0.55;
  private readonly playerPassiveItems = new Map<Rarity, PlayerPassiveItem[]>();

  // Weapon passives
  private readonly WEAPON_PASSIVE_DROP_RATE = 0.25;

  public chancePercentageIncrease = 0;

  constructor(private game: Game) {
    this.initPlayerPassiveItems();
  }

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
    this.currentRerollCost = 100;
    this.rerollCount = 0;

    const itemsToGenerateCount = this.ITEM_SLOT_COUNT - this.currentShopItems.length;
    this.generateShopItems(itemsToGenerateCount);
  }

  private generateShopItems(itemsCount : number): void {

    if(itemsCount === this.ITEM_SLOT_COUNT) {
      // Asked to generate a full shop, means we must reset the shop
      this.currentShopItems = [];
    }

    for (let i = 0; i < itemsCount; i++) {
      const itemChance = randomFloat(0, 1);
      const rarity = this.getRandomRarity();

      // WeaponPassive item (10% probability)
      if (itemChance < this.WEAPON_PASSIVE_DROP_RATE) {
        const weaponPassiveItem = this.getRandomWeaponPassiveItem(rarity);
        if (weaponPassiveItem) {
          this.currentShopItems.push(weaponPassiveItem);
          continue;
        }
      }

      // Player passive item
      else if (
        itemChance <
        this.PLAYER_PASSIVE_DROP_RATE + this.WEAPON_PASSIVE_DROP_RATE
      ) {
        const playerPassiveItem = this.getRandomPlayerPassiveItem(rarity);
        this.currentShopItems.push(playerPassiveItem);
        continue;
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
    const index = this.currentShopItems.indexOf(item);
    if (index === -1) {
      throw new Error('Item not found in the shop!');
    }
    this.currentShopItems.splice(index, 1);

    this.onShopItemsChange.notifyObservers(this.currentShopItems);
    this.game.saveManager.save();
  }

  private getRandomRarity(): Rarity {
    let rarityChance = randomFloat(0, 1);
    rarityChance += this.chancePercentageIncrease;

    // fixed rarities drop rates for now
    if (rarityChance < 0.6) {
      return Rarity.COMMON;
    } else if (rarityChance < 0.87) {
      return Rarity.RARE;
    } else if (rarityChance < 0.95) {
      return Rarity.EPIC;
    } else {
      return Rarity.LEGENDARY;
    }
  }

  public getRerollCost(): number {
    return Math.floor(
      this.currentRerollCost + this.BONUS_COST_PER_REROLL * this.rerollCount,
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

    this.generateShopItems(this.ITEM_SLOT_COUNT);

    this.game.runManager.addMoneySpentOnRerolls(rerollCost);

    // the money changes so we need to save
    this.game.saveManager.save();
  }

  public addChancePercentageIncrease(percentage: number): void {
    this.chancePercentageIncrease += percentage;
    this.onChancePercentageChange.notifyObservers(this.chancePercentageIncrease);
  }

  // ----------------- Player passives -----------------------
  // ---------------------------------------------------------

  private getRandomPlayerPassiveItem(rarity: Rarity): PlayerPassiveItem {
    const playerPassiveItemArray = this.playerPassiveItems.get(rarity);

    // there are no items of the current rarity
    if (!playerPassiveItemArray || playerPassiveItemArray.length === 0) {
      // try to get a previous rarity item
      if (rarity === Rarity.COMMON) {
        // in theory we should never reach this point
        throw new Error('No player passive items available for the current rarity!');
      } else {
        const previousRarity = (rarity - 1) as Rarity;
        return this.getRandomPlayerPassiveItem(previousRarity);
      }
    }

    const randomIndex = randomInt(0, playerPassiveItemArray.length - 1);
    const randomItem = playerPassiveItemArray[randomIndex];

    return randomItem;
  }

  public buyPlayerPassive(playerPassive: PlayerPassiveItem): void {
    this.game.moneyManager.removePlayerMoney(playerPassive.price);
    this.game.player.inventory.addPlayerPassiveItem(playerPassive);
    this.removeItemFromShop(playerPassive);
    this.game.runManager.addMoneySpentOnItems(playerPassive.price);
  }

  // ----------------------- Weapons -------------------------
  // ---------------------------------------------------------

  private getRandomWeaponItem(rarity: Rarity): WeaponItem {
    const weaponsData = this.game.weaponDataManager.getWeaponsData();
    const weaponTypes = Array.from(weaponsData.keys());

    const randomIndex = randomInt(0, weaponsData.size - 1);

    const weaponType = weaponTypes[randomIndex];
    const weaponData = weaponsData.get(weaponType)!;

    return new WeaponItem(
      weaponData.weaponName,
      weaponData.shopDescription,
      this.getPriceForItem(rarity, ShopItemType.WEAPON),
      ShopItemType.WEAPON,
      rarity,
      weaponType,
    );
  }

  public async buyWeapon(weaponItem: WeaponItem, inventoryIndex: number): Promise<void> {
    this.game.moneyManager.removePlayerMoney(weaponItem.price);

    const weapon = new Weapon(this.game.player, weaponItem.weaponType, weaponItem.rarity);
    await weapon.init();

    const oldWeapon = this.game.player.getInventory().getWeapons()[inventoryIndex];

    // Dispose of old weapon if the slot was taken
    if (oldWeapon) {
      oldWeapon.dispose();
    }

    this.game.player.replaceWeaponAtIndex(inventoryIndex, weapon);

    this.removeItemFromShop(weaponItem);
    this.game.runManager.addMoneySpentOnItems(weaponItem.price);
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
      this.getPriceForItem(rarity, ShopItemType.WEAPON_PASSIVE),
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

    // Remove the item from the shop
    this.removeItemFromShop(weaponPassive);

    this.game.runManager.addMoneySpentOnItems(weaponPassive.price);
  }

  private getPriceForItem(rarity: Rarity, itemType: ShopItemType): number {
    const pricesForWeapons = [150, 350, 550, 750];
    const pricesForWeaponPassives = [100, 400, 400, 1000];

    switch (itemType) {
      case ShopItemType.WEAPON:
        return pricesForWeapons[rarity];
      case ShopItemType.WEAPON_PASSIVE:
        return pricesForWeaponPassives[rarity];
      case ShopItemType.PLAYER_PASSIVE:
        return -1; // Player passives prices are handled separately, see PlayerPassiveItem class
      default:
        throw new Error('Invalid item type for price calculation');
    }
  }
}
