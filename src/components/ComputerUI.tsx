import { useContext, useEffect, useState } from 'react';
import { GameContext } from '../contexts/GameContext';
import '../styles/computerUI.css';
import '../styles/shared.css';
import { ShopItem } from '../lib/shop/shopItem';
import { Rarity } from '../lib/shop/rarity';
import { ShopItemType } from '../lib/shop/shopItemType';
import { PlayerPassiveItem } from '../lib/shop/playerPassiveItem';
import { WeaponItem } from '../lib/shop/weaponItem';
import { WeaponPassiveItem } from '../lib/shop/weaponPassiveItem';
import { WeaponPassiveT3 } from '../lib/weapons/passives/weaponPassivesManager';
import { withClickSound } from '../lib/utils/withClickSound';
import BaseContainer from './BaseContainer';

import CreditsCurrencyIcon from '@/assets/icons/credits-currency.svg?react';
import ItemIcon from './ItemIcon';
import SpeedometerIcon from '@/assets/icons/speedometer.svg?react';
import HeartPlusIcon from '@/assets/icons/heart-plus.svg?react';
import EternalLoveIcon from '@/assets/icons/eternal-love.svg?react';
import SprintIcon from '@/assets/icons/sprint.svg?react';
import ShamrockIcon from '@/assets/icons/shamrock.svg?react';
import DodgingIcon from '@/assets/icons/dodging.svg?react';
import InventoryUI, { InventoryUIType } from './InventoryUI';
import { SoundCategory } from '../lib/sound/soundSystem';
import { Weapon } from '../lib/weapons/weapon';

const ComputerUI = () => {
  const game = useContext(GameContext);

  const [playerMoney, setPlayerMoney] = useState<number>(0);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);

  const [selectedWeapon, setSelectedWeapon] = useState<WeaponItem | null>(null);
  const [selectedWeaponPassive, setSelectedWeaponPassive] =
    useState<WeaponPassiveItem | null>(null);

  // player stats
  const [regenSpeedPercentageIncrease, setRegenSpeedPercentageIncrease] =
    useState<number>(0);
  const [chancePercentageIncrease, setChancePercentageIncrease] = useState<number>(0);
  const [maxHealthIncrease, setMaxHealthIncrease] = useState<number>(0);
  const [speedPercentageIncrease, setSpeedPercentageIncrease] = useState<number>(0);
  const [dodgeChancePercentageIncrease, setDodgeChancePercentageIncrease] =
    useState<number>(0);
  const [slideSpeedPercentageIncrease, setSlideSpeedPercentageIncrease] =
    useState<number>(0);

  const handleCloseUI = () => {
    if (!game) return;
    game.uiManager.hideUI();
  };

  const handleBuyItem = (item: ShopItem) => {
    if (!game) return;

    if (item.type === ShopItemType.WEAPON) {
      setSelectedWeapon(item as WeaponItem);
    } else if (item.type === ShopItemType.PLAYER_PASSIVE) {
      game.shopManager.buyPlayerPassive(item as PlayerPassiveItem);
    } else if (item.type === ShopItemType.WEAPON_PASSIVE) {
      setSelectedWeaponPassive(item as WeaponPassiveItem);
    }
  };

  const handleReroll = () => {
    if (!game) return;
    game.shopManager.rerollShop();
  };

  const handleReplaceWeapon = async (weapon: WeaponItem, index: number) => {
    if (!game) return;

    await game.shopManager.buyWeapon(weapon, index);
    setSelectedWeapon(null);
  };

  const handleApplyWeaponPassive = (weaponPassive: WeaponPassiveItem, index: number) => {
    if (!game) return;

    game.shopManager.buyWeaponPassive(weaponPassive, index);
    setSelectedWeaponPassive(null);
  };

  const getShopItemType = (item: ShopItem) => {
    switch (item.type) {
      case ShopItemType.PLAYER_PASSIVE:
        return 'PLAYER PASSIVE';
      case ShopItemType.WEAPON:
        return 'WEAPON';
      case ShopItemType.WEAPON_PASSIVE:
        return 'WEAPON PASSIVE';
    }
  };

  useEffect(() => {
    if (!game) return;

    // set initial values
    setPlayerMoney(game.moneyManager.getPlayerMoney());
    setShopItems(game.shopManager.getShopItems());

    // player stats
    setRegenSpeedPercentageIncrease(game.player.regenSpeedPercentageIncrease);
    setChancePercentageIncrease(game.shopManager.chancePercentageIncrease);
    setMaxHealthIncrease(game.player.maxHealthIncrease);
    setSpeedPercentageIncrease(game.player.moveSpeedPercentageIncrease);
    setDodgeChancePercentageIncrease(game.player.dodgeChancePercentageIncrease);
    setSlideSpeedPercentageIncrease(game.player.slideSpeedPercentageIncrease);

    // initialize observers
    const onPlayerMoneyChangeObserver =
      game.moneyManager.onPlayerMoneyChange.add(setPlayerMoney);

    const onShopItemsChangeObserver =
      game.shopManager.onShopItemsChange.add(setShopItems);

    // player stats observers
    const onRegenSpeedChangeObserver = game.player.onRegenSpeedPercentageChange.add(
      setRegenSpeedPercentageIncrease,
    );
    const onChancePercentageChangeObserver =
      game.shopManager.onChancePercentageChange.add(setChancePercentageIncrease);
    const onMaxHealthChangeObserver =
      game.player.onMaxHealthChange.add(setMaxHealthIncrease);
    const onSpeedPercentageChangeObserver = game.player.onSpeedPercentageChange.add(
      setSpeedPercentageIncrease,
    );
    const onDodgeChancePercentageChangeObserver =
      game.player.onDodgeChancePercentageChange.add(setDodgeChancePercentageIncrease);
    const onSlideSpeedPercentageChangeObserver =
      game.player.onSlideSpeedPercentageChange.add(setSlideSpeedPercentageIncrease);

    return () => {
      if (!game) return;

      // remove observers when component unmounts
      onPlayerMoneyChangeObserver.remove();
      onShopItemsChangeObserver.remove();

      onRegenSpeedChangeObserver.remove();
      onChancePercentageChangeObserver.remove();
      onMaxHealthChangeObserver.remove();
      onSpeedPercentageChangeObserver.remove();
      onDodgeChancePercentageChangeObserver.remove();
      onSlideSpeedPercentageChangeObserver.remove();
    };
  }, [game]);

  const replaceWeaponCallback = (weaponIndex: number) => {
    if (!selectedWeapon || !game) return;

    game.soundManager.playSound('placeholder', SoundCategory.UI);
    handleReplaceWeapon(selectedWeapon, weaponIndex);
  };

  const applyPassiveCallback = (weaponIndex: number) => {
    if (!selectedWeaponPassive || !game) return;

    game.soundManager.playSound('placeholder', SoundCategory.UI);
    handleApplyWeaponPassive(selectedWeaponPassive, weaponIndex);
  };

  const canApplyPassive = (weapon: Weapon, isSlotEmpty: boolean) => {
    if (isSlotEmpty) return true;

    // Check if the weapon already has the same passive
    const hasSamePassive = weapon.embeddedPassives.some(
      (passive) => passive === selectedWeaponPassive?.weaponPassiveType,
    );

    // Check if the weapon already has a legendary passive
    const hasLegendaryPassive = weapon.embeddedPassives.some((passive) =>
      Object.values(WeaponPassiveT3).includes(passive as WeaponPassiveT3),
    );

    return (
      hasSamePassive ||
      (selectedWeaponPassive?.rarity === Rarity.LEGENDARY && hasLegendaryPassive)
    );
  };

  if (!game) return null;

  if (selectedWeapon !== null) {
    return (
      <BaseContainer
        title="INVENTORY"
        backButtonCallback={withClickSound(game, () => setSelectedWeapon(null))}
      >
        <InventoryUI
          isDisabled={() => false}
          buttonCallback={replaceWeaponCallback}
          buttonText="REPLACE"
          inventoryUIType={InventoryUIType.WEAPON}
          selectedWeapon={selectedWeapon}
        ></InventoryUI>
      </BaseContainer>
    );
  }

  if (selectedWeaponPassive !== null) {
    return (
      <BaseContainer
        title="INVENTORY"
        backButtonCallback={withClickSound(game, () => setSelectedWeaponPassive(null))}
      >
        <InventoryUI
          isDisabled={canApplyPassive}
          buttonCallback={applyPassiveCallback}
          buttonText="APPLY"
          inventoryUIType={InventoryUIType.WEAPON_PASSIVE}
          selectedWeaponPassive={selectedWeaponPassive}
        ></InventoryUI>
      </BaseContainer>
    );
  }

  return (
    <BaseContainer title="SHOP" backButtonCallback={withClickSound(game, handleCloseUI)}>
      <div className="computer-interface-container">
        <div className="shop-container">
          <div className="shop-header">
            <div className="shop-money-container">
              <CreditsCurrencyIcon className="shop-header-currency-icon" />
              <h2>{playerMoney}</h2>
            </div>
            <button
              className="button shop-header-button"
              onClick={withClickSound(game, handleReroll)}
              disabled={playerMoney < game.shopManager.getRerollCost()}
            >
              <h2>REROLL {'('}</h2>
              <CreditsCurrencyIcon className="shop-header-currency-icon" />
              <h2>
                {game.shopManager.getRerollCost()} {')'}
              </h2>
            </button>
          </div>
          <div className="shop-items-container">
            {shopItems.map((item, index) => (
              <div
                key={index}
                className={`shop-item ${Rarity[item.rarity].toLowerCase()}-border`}
              >
                <div className="shop-item-header">
                  <h2 className={`shop-item-name ${Rarity[item.rarity].toLowerCase()}`}>
                    {item.name}
                  </h2>
                  <h4 className="shop-item-type">{getShopItemType(item)}</h4>
                </div>
                <ItemIcon
                  iconName={item.name.toLowerCase()}
                  className={`shop-item-icon ${Rarity[item.rarity].toLowerCase()}-shadow`}
                  shopItemType={item.type}
                />
                <p className="shop-item-description">{item.description}</p>
                <button
                  className={`button shop-item-button ${Rarity[item.rarity].toLowerCase()}-border ${Rarity[item.rarity].toLowerCase()}`}
                  onClick={withClickSound(game, () => handleBuyItem(item))}
                  disabled={item.price > playerMoney}
                >
                  <h3>BUY</h3>
                  <CreditsCurrencyIcon className="shop-item-currency-icon" />
                  <h3>{item.price}</h3>
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="stats-container">
          <h1 className="stats-title">STATISTICS</h1>
          <div className="stats-list">
            <ul>
              <li className="stats-item">
                <div className="stats-item-title">
                  <SpeedometerIcon className="stats-icon" />
                  Speed :
                </div>
                <p className="stats-item-value">
                  {speedPercentageIncrease >= 0 ? '+' : ''}
                  {Math.floor(speedPercentageIncrease * 100)}%
                </p>
              </li>
              <li className="stats-item">
                <div className="stats-item-title">
                  <HeartPlusIcon className="stats-icon" />
                  Max health :
                </div>
                <p className="stats-item-value">
                  {maxHealthIncrease >= 0 ? '+' : ''}
                  {Math.floor(maxHealthIncrease)}
                </p>
              </li>
              <li className="stats-item">
                <div className="stats-item-title">
                  <EternalLoveIcon className="stats-icon" />
                  Regen speed :
                </div>
                <p className="stats-item-value">
                  {regenSpeedPercentageIncrease >= 0 ? '+' : ''}
                  {Math.floor(regenSpeedPercentageIncrease * 100)}%
                </p>
              </li>
              <li className="stats-item">
                <div className="stats-item-title">
                  <SprintIcon className="stats-icon" />
                  Slide speed :
                </div>
                <p className="stats-item-value">
                  {slideSpeedPercentageIncrease >= 0 ? '+' : ''}
                  {Math.floor(slideSpeedPercentageIncrease * 100)}%
                </p>
              </li>
              <li className="stats-item">
                <div className="stats-item-title">
                  <ShamrockIcon className="stats-icon" />
                  Chance :
                </div>
                <p className="stats-item-value">
                  {chancePercentageIncrease >= 0 ? '+' : ''}
                  {Math.floor(chancePercentageIncrease * 100)}%
                </p>
              </li>
              <li className="stats-item">
                <div className="stats-item-title">
                  <DodgingIcon className="stats-icon" />
                  Dodge chance :
                </div>
                <p className="stats-item-value">
                  {dodgeChancePercentageIncrease >= 0 ? '+' : ''}
                  {Math.floor(dodgeChancePercentageIncrease * 100)}%
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </BaseContainer>
  );
};

export default ComputerUI;
