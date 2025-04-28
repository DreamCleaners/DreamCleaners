import { useContext, useState } from 'react';
import { GameContext } from '../contexts/GameContext';
import '../styles/workbenchUI.css';
import { Rarity } from '../lib/shop/rarity';
import { withClickSound } from '../lib/utils/withClickSound';
import BaseContainer from './BaseContainer';
import InventoryUI from './InventoryUI';
import { Weapon } from '../lib/weapons/weapon';
import CreditsCurrencyIcon from '@/assets/icons/credits-currency.svg?react';

const WorkbenchUI = () => {
  const game = useContext(GameContext);
  const [weapons, setWeapons] = useState(game?.player.getInventory().getWeapons() || []);

  const handleCloseUI = () => {
    game?.uiManager.hideUI();
  };

  const handleImproveQuality = (index: number) => {
    if (!game) return;

    const weapon = weapons[index];
    const cost = game.workbenchManager.getCostForQualityUpgrade(weapon);

    if (game.moneyManager.getPlayerMoney() >= cost) {
      game.moneyManager.removePlayerMoney(cost); // Deduct the cost
      game.workbenchManager.improveWeaponQuality(index); // Improve the weapon quality
      setWeapons([...game.player.getInventory().getWeapons()]); // Re-render with updated weapons
    }
  };

  const getUpgradeText = (weapon: Weapon | undefined) => {
    if (!weapon) return <h2>NO WEAPON</h2>;

    const cost = game?.workbenchManager.getCostForQualityUpgrade(weapon);

    if (weapon.currentRarity === Rarity.LEGENDARY) {
      return <h2>MAX</h2>;
    }

    return (
      <div className="workbench-upgrade-text">
        <h2>UPGRADE</h2>
        <CreditsCurrencyIcon className="shop-item-currency-icon" />
        <h2>{cost}</h2>
      </div>
    );
  };

  const isDisabled = (weapon: Weapon, isSlotEmpty: boolean) => {
    if (isSlotEmpty) return true;

    const cost = game?.workbenchManager.getCostForQualityUpgrade(weapon) ?? 0;
    const playerMoney = game?.moneyManager.getPlayerMoney() ?? 0;

    return weapon.currentRarity === Rarity.LEGENDARY || playerMoney < cost;
  };

  if (!game) return null;

  return (
    <BaseContainer
      title="WORKBENCH"
      backButtonCallback={withClickSound(game, handleCloseUI)}
    >
      <InventoryUI
        isDisabled={isDisabled}
        buttonCallback={handleImproveQuality}
        getButtonText={getUpgradeText}
        titleElement={
          <div className="workbench-money-container">
            <CreditsCurrencyIcon className="shop-header-currency-icon" />
            <h2>{game.moneyManager.getPlayerMoney()}</h2>
          </div>
        }
      ></InventoryUI>
    </BaseContainer>
  );
};

export default WorkbenchUI;
