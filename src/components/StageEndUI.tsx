import { useContext, useState } from 'react';
import { GameContext } from '../contexts/GameContext';
import { Rarity } from '../lib/shop/rarity.ts';
import '../styles/stageEndUI.css';
import '../styles/shared.css';
import { WeaponPassivesManager } from '../lib/weapons/passives/weaponPassivesManager';
import { withClickSound } from '../lib/utils/withClickSound';
import BaseContainer from './BaseContainer.tsx';
import { ShopItemType } from '../lib/shop/shopItemType.ts';
import InventoryUI from './InventoryUI.tsx';

import WilliamTellSkullIcon from '@/assets/icons/william-tell-skull.svg?react';
import StopwatchIcon from '@/assets/icons/stopwatch.svg?react';
import InternalInjuryIcon from '@/assets/icons/internal-injury.svg?react';
import HolyGrailIcon from '@/assets/icons/holy-grail.svg?react';
import MoneyStackIcon from '@/assets/icons/money-stack.svg?react';
import ItemIcon from './ItemIcon.tsx';
import { StageLayout } from '../lib/scenes/stageLayout.ts';

const StageEndUI = () => {
  const game = useContext(GameContext);
  const [rewardUsed, setRewardUsed] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  if (!game) return null;

  const stageReward = game.sceneManager.getCurrentScene()?.stageInfo.stageReward;
  const stageRewardGold = Math.ceil(
    (stageReward?.getMoneyReward() ?? 0) * game.scoreManager.getScoreFactor()
);
  const weaponReward = stageReward?.getWeaponReward();

  const handleReplaceWeapon = async (weaponIndex: number) => {
    if (!stageReward || !weaponReward) return;

    try {
      const newWeapon = await stageReward.createWeapon(game.player);

      game.player.replaceWeaponAtIndex(weaponIndex, newWeapon);

      setRewardUsed(true);

      setShowInventory(false);
    } catch (error) {
      console.error('Failed to create weapon:', error);
    }
  };

  const handleHideUI = () => {
    game.uiManager.hideUI();
    game.sceneManager.changeScene(StageLayout.HUB);
  };

  const getPrettyTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (showInventory) {
    return (
      <BaseContainer
        title="INVENTORY"
        backButtonCallback={withClickSound(game, () => setShowInventory(false))}
      >
        <InventoryUI
          isDisabled={() => false}
          buttonCallback={handleReplaceWeapon}
          getButtonText={() => <h2>REPLACE</h2>}
          titleElement={
            <h2>CHOOSE A SLOT FOR WEAPON: {weaponReward?.weaponType.toUpperCase()}</h2>
          }
        ></InventoryUI>
      </BaseContainer>
    );
  }

  return (
    <BaseContainer title="DREAM CLEANED">
      <div className="score-interface-container">
        <div className="score-fixed-interface-container">
          <div className="score-stats-container">
            <div className="score-stats-list">
              <ul>
                <li className="score-stats-item">
                  <div className="score-stats-item-title">
                    <WilliamTellSkullIcon className="score-stats-icon" />
                    Enemies killed :
                  </div>
                  <p className="score-stats-item-value">{game.scoreManager.totalKill}</p>
                </li>
                <li className="score-stats-item">
                  <div className="score-stats-item-title">
                    <StopwatchIcon className="score-stats-icon" />
                    Time elapsed :
                  </div>
                  <p className="score-stats-item-value">
                    {getPrettyTime(game.scoreManager.timeElapsed)}
                  </p>
                </li>
                <li className="score-stats-item">
                  <div className="score-stats-item-title">
                    <InternalInjuryIcon className="score-stats-icon" />
                    Damage taken :
                  </div>
                  <p className="score-stats-item-value">
                    {game.scoreManager.totalDamageTaken.toFixed(0)}
                  </p>
                </li>
                <li className="score-stats-item">
                  <div className="score-stats-item-title">
                    <HolyGrailIcon className="score-stats-icon" />
                    Score multiplier :
                  </div>
                  <p className="score-stats-item-value">
                    {game.scoreManager.getScoreFactor()}
                  </p>
                </li>
                <li className="score-stats-item">
                  <div className="score-stats-item-title">
                    <MoneyStackIcon className="score-stats-icon" />
                    Final money reward :
                  </div>
                  <p className="score-stats-item-value">{stageRewardGold}</p>
                </li>
              </ul>
            </div>
          </div>
          {weaponReward && !rewardUsed && (
            <div
              className={`score-weapon-reward ${Rarity[weaponReward.rarity].toLowerCase()}-border`}
            >
              <div className="score-weapon-header">
                <h2
                  className={`score-weapon-name ${Rarity[weaponReward.rarity].toLowerCase()}`}
                >
                  {weaponReward.weaponType.toUpperCase()}
                </h2>
              </div>
              <ItemIcon
                iconName={weaponReward.weaponType}
                className={`score-weapon-icon ${Rarity[weaponReward.rarity].toLowerCase()}-shadow`}
                shopItemType={ShopItemType.WEAPON}
              />
              <div className="score-weapon-passive-container">
                {weaponReward.embeddedPassives.length === 0 && <div>NO PASSIVES</div>}
                {weaponReward.embeddedPassives.map((passive, index) => (
                  <div
                    className={`score-weapon-passive-item ${Rarity[
                      WeaponPassivesManager.getInstance().getPassiveRarity(passive)
                    ].toLowerCase()}-border`}
                    key={index}
                  >
                    <p
                      key={index}
                      className={`score-weapon-passive-text ${Rarity[
                        WeaponPassivesManager.getInstance().getPassiveRarity(passive)
                      ].toLowerCase()}`}
                    >
                      {WeaponPassivesManager.getInstance().getPrettyPassiveName(passive)}
                    </p>
                    <ItemIcon
                      iconName={passive.toLowerCase()}
                      className={`score-weapon-passive-icon ${Rarity[
                        WeaponPassivesManager.getInstance().getPassiveRarity(passive)
                      ].toLowerCase()}-shadow`}
                      shopItemType={ShopItemType.WEAPON_PASSIVE}
                    />
                  </div>
                ))}
              </div>
              <button
                className={`button score-weapon-button ${Rarity[weaponReward.rarity].toLowerCase()}-border ${Rarity[weaponReward.rarity].toLowerCase()}`}
                onClick={withClickSound(game, () => setShowInventory(true))}
              >
                <h3>GET WEAPON</h3>
              </button>
            </div>
          )}
          <div></div>
        </div>
        <button
          className="score-button-continue button"
          onClick={withClickSound(game, handleHideUI)}
        >
          <h2>CONTINUE</h2>
        </button>
      </div>
    </BaseContainer>
  );
};

export default StageEndUI;
