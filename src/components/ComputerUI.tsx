import { useContext, useEffect, useState } from 'react';
import { GameContext } from '../contexts/GameContext';
import '../styles/computerUI.css';
import { ShopItem } from '../lib/shop/shopItem';
import { Rarity } from '../lib/shop/rarity';
import { ShopItemType } from '../lib/shop/shopItemType';
import { PlayerPassiveItem } from '../lib/shop/playerPassiveItem';
import { WeaponItem } from '../lib/shop/weaponItem';
import { WeaponPassiveItem } from '../lib/shop/weaponPassiveItem';
import {
  WeaponPassivesManager,
  WeaponPassiveT3,
} from '../lib/weapons/passives/weaponPassivesManager';
import { withClickSound } from './Utils';
import { SoundCategory } from '../lib/sound/soundSystem';

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
    game.soundManager.playSound('pcLeave', SoundCategory.EFFECT);
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

  // debug only!
  const getBackgroundColor = (rarity: Rarity) => {
    switch (rarity) {
      case Rarity.COMMON:
        return 'gray';
      case Rarity.RARE:
        return 'green';
      case Rarity.EPIC:
        return 'purple';
      case Rarity.LEGENDARY:
        return 'orange';
    }
  };

  // debug only!
  const getShopItemType = (item: ShopItem) => {
    switch (item.type) {
      case ShopItemType.PLAYER_PASSIVE:
        return 'Player Passive';
      case ShopItemType.WEAPON:
        return 'Weapon';
      case ShopItemType.WEAPON_PASSIVE:
        return 'Weapon Passive';
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

  if (!game) return null;

  if (selectedWeapon !== null) {
    return (
      <div className="computer-interface-container">
        <h1>Choose a slot for your weapon</h1>
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index}>
            {game.player.inventory.getWeapons().length <= index ? (
              <div>Empty slot</div>
            ) : (
              <h3
                style={{
                  background: getBackgroundColor(
                    game.player.inventory.getWeapons()[index].currentRarity,
                  ),
                }}
              >
                {game.player.inventory.getWeapons()[index].weaponData.weaponName}
              </h3>
            )}
            <button
              onClick={withClickSound(game, () =>
                handleReplaceWeapon(selectedWeapon, index),
              )}
            >
              Replace
            </button>
          </div>
        ))}
        <button onClick={withClickSound(game, () => setSelectedWeapon(null))}>
          Back
        </button>
      </div>
    );
  }

  if (selectedWeaponPassive !== null) {
    return (
      <div className="computer-interface-container">
        <h1>Choose a weapon to apply the passive</h1>
        {Array.from({ length: 2 }, (_, index) => {
          const weapon = game.player.inventory.getWeapons()[index];
          const isSlotEmpty = game.player.inventory.getWeapons().length <= index;

          // Check if the weapon already has the same passive
          const hasSamePassive =
            weapon?.embeddedPassives.some(
              (passive) => passive === selectedWeaponPassive.weaponPassiveType,
            ) ?? false;

          // Check if the weapon already has a legendary passive
          const hasLegendaryPassive =
            weapon?.embeddedPassives.some((passive) =>
              Object.values(WeaponPassiveT3).includes(passive as WeaponPassiveT3),
            ) ?? false;
          // Determine if the button should be disabled
          const isDisabled =
            isSlotEmpty ||
            hasSamePassive ||
            (selectedWeaponPassive.rarity === Rarity.LEGENDARY && hasLegendaryPassive);

          // Determine the message to display
          let message = '';
          if (hasSamePassive) {
            message = `This weapon already possesses "${WeaponPassivesManager.getInstance().getPrettyPassiveName(selectedWeaponPassive.weaponPassiveType)}"! Can't apply twice!`;
          } else if (
            selectedWeaponPassive.rarity === Rarity.LEGENDARY &&
            hasLegendaryPassive
          ) {
            message = 'One weapon cannot have more than one legendary passive.';
          }

          return (
            <div key={index}>
              {isSlotEmpty ? (
                <div>Empty slot</div>
              ) : (
                <h3
                  style={{
                    background: getBackgroundColor(weapon.currentRarity),
                  }}
                >
                  {weapon.weaponData.weaponName}
                </h3>
              )}
              <button
                onClick={withClickSound(game, () =>
                  handleApplyWeaponPassive(selectedWeaponPassive, index),
                )}
                disabled={isDisabled}
              >
                Apply to Weapon
              </button>
              {message && <p style={{ color: 'red' }}>{message}</p>}
            </div>
          );
        })}
        <button onClick={withClickSound(game, () => setSelectedWeaponPassive(null))}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="computer-interface-container">
      <h1>SHOP</h1>
      <button onClick={withClickSound(game, handleCloseUI)}>Close</button>
      <p>Money: {playerMoney}$</p>
      <button
        onClick={withClickSound(game, handleReroll)}
        disabled={playerMoney < game.shopManager.getRerollCost()}
      >
        Reroll ({game.shopManager.getRerollCost()}$)
      </button>
      {shopItems.map((item, index) => (
        <div key={index} style={{ backgroundColor: getBackgroundColor(item.rarity) }}>
          <hr />
          <h4 style={{ color: 'black' }}>[{getShopItemType(item)}]</h4>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
          <p>Price: {item.price}$</p>
          <button
            onClick={withClickSound(game, () => handleBuyItem(item))}
            disabled={item.price > playerMoney}
          >
            Buy
          </button>
        </div>
      ))}
      <h2>Player Statistics</h2>
      <ul>
        <li>
          Regen speed : {regenSpeedPercentageIncrease >= 0 ? '+' : ''}
          {Math.floor(regenSpeedPercentageIncrease * 100)}%
        </li>
        <li>
          Chance : {chancePercentageIncrease >= 0 ? '+' : ''}
          {Math.floor(chancePercentageIncrease * 100)}%
        </li>
        <li>
          Max health : {maxHealthIncrease >= 0 ? '+' : ''}
          {Math.floor(maxHealthIncrease)}
        </li>
        <li>
          Speed : {speedPercentageIncrease >= 0 ? '+' : ''}
          {Math.floor(speedPercentageIncrease * 100)}%
        </li>
        <li>
          Dodge chance : {dodgeChancePercentageIncrease >= 0 ? '+' : ''}
          {Math.floor(dodgeChancePercentageIncrease * 100)}%
        </li>
        <li>
          Slide speed : {slideSpeedPercentageIncrease >= 0 ? '+' : ''}
          {Math.floor(slideSpeedPercentageIncrease * 100)}%
        </li>
      </ul>
    </div>
  );
};

export default ComputerUI;
