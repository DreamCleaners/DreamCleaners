import { useEffect, useState, useContext } from 'react';
import '../styles/stageSelectionUI.css';
import '../styles/shared.css';
import { StagesManager } from '../lib/stages/stagesManager';
import { GameContext } from '../contexts/GameContext';
import { Rarity } from '../lib/shop/rarity.ts';
import { StageInformation } from '../lib/stages/stageInformation';
import { withClickSound } from '../lib/utils/withClickSound';
import BaseContainer from './BaseContainer.tsx';
import { RewardWeaponDescription } from '../lib/stages/rewardWeaponDescription.ts';
import ItemIcon from './ItemIcon.tsx';

import MoneyStackIcon from '@/assets/icons/money-stack.svg?react';
import CreditsCurrencyIcon from '@/assets/icons/credits-currency.svg?react';
import { ShopItemType } from '../lib/shop/shopItemType.ts';

const StageSelectionUI = () => {
  const game = useContext(GameContext);
  const [stageInfo, setStageInfo] = useState<StageInformation | null>(null);
  const [stageImagePath, setStageImagePath] = useState<string | null>(null);
  const [weaponReward, setWeaponReward] = useState<RewardWeaponDescription | undefined>(
    undefined,
  );

  useEffect(() => {
    const stagesManager = StagesManager.getInstance();
    const selectedBedInfo = stagesManager.getSelectedBedInformation();
    setStageInfo(selectedBedInfo);

    setWeaponReward(selectedBedInfo?.stageReward.getWeaponReward());

    // Get the image path for the stage if available
    if (selectedBedInfo && game?.stageInformationManager) {
      const imagePath = game.stageInformationManager.getStageImagePath(
        selectedBedInfo.proposedFixedStageLayout || 'procedural',
      );
      setStageImagePath(imagePath);
    }
  }, [game?.stageInformationManager]);

  const handleHideUI = () => {
    game?.uiManager.hideUI();
  };

  const handleEnterStage = () => {
    handleHideUI();
    StagesManager.getInstance().enterStage();
  };

  const getDifficultyIcons = (difficulty: number) => {
    const icons = [];

    const iconsPaths = ['daemon-skull', 'crowned-skull', 'skull-shield'];
    const iconPathIndex = Math.min(
      Math.floor((difficulty - 1) / 10),
      iconsPaths.length - 1,
    );

    const iconsCount =
      difficulty === 0 ? 0 : difficulty % 10 === 0 ? 10 : difficulty % 10;
    for (let i = 0; i < iconsCount; i++) {
      icons.push(
        <img
          key={i}
          src={`/src/assets/icons/${iconsPaths[iconPathIndex]}.svg`}
          alt="Difficulty Icon"
          className="difficulty-icon"
        />,
      );
    }
    return <div className="difficulty-icon-container">{icons}</div>;
  };

  return (
    <BaseContainer
      title={stageInfo?.proposedFixedStageLayout?.toUpperCase() || 'Procedural Stage'}
      backButtonCallback={withClickSound(game, handleHideUI)}
    >
      <div className="stage-selection-container">
        <div className="stage-selection-content">
          <div className="stage-selection-item-container">
            <h2 className="stage-selection-item-title">REWARDS</h2>
            <div className="stage-selection-item">
              <div className="stage-selection-item-reward-container">
                <div className="stage-selection-item-reward">
                  <MoneyStackIcon className="reward-icon" />
                  <div className="reward-money-text-container">
                    <CreditsCurrencyIcon className="currency-icon" />
                    <h2>{stageInfo?.stageReward.getMoneyReward() ?? 0}</h2>
                  </div>
                </div>
                {weaponReward ? (
                  <div
                    className={`stage-selection-item-reward ${Rarity[
                      weaponReward.rarity
                    ].toLowerCase()}-border`}
                  >
                    <ItemIcon
                      iconName={weaponReward.weaponType.toLowerCase()}
                      className={`reward-icon ${Rarity[
                        weaponReward.rarity
                      ].toLowerCase()}-shadow`}
                      shopItemType={ShopItemType.WEAPON}
                    />
                    <div className="reward-weapon-text-container">
                      <h2
                        className={`reward-weapon-title ${Rarity[
                          weaponReward.rarity
                        ].toLowerCase()}`}
                      >
                        {weaponReward.weaponType.toUpperCase()}
                      </h2>
                      {weaponReward.embeddedPassives.length > 0 && (
                        <p className="reward-weapon-passive-text">
                          +{weaponReward.embeddedPassives.length} PASSIVE
                          {weaponReward.embeddedPassives.length > 1 ? 'S' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>
          <div className="stage-selection-item-container">
            <h2 className="stage-selection-item-title">OVERVIEW</h2>
            <div className="stage-selection-item">
              {stageImagePath && (
                <img
                  src={stageImagePath}
                  alt={`Stage ${stageInfo?.proposedFixedStageLayout || 'image'}`}
                  className="stage-selection-image"
                />
              )}
            </div>
          </div>
          <div className="stage-selection-item-container">
            <h2 className="stage-selection-item-title">DIFFICULTY</h2>
            <div className="stage-selection-item">
              {getDifficultyIcons(stageInfo?.difficulty || 0)}
            </div>
          </div>
          <div className="stage-selection-item-container">
            <h2 className="stage-selection-item-title">DESCRIPTION</h2>
            <div className="stage-selection-item">
              <div className="stage-selection-item-description">
                {stageInfo && game?.stageInformationManager ? (
                  game.stageInformationManager.buildStageDescription(stageInfo.enemyTypes)
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="stage-selection-buttons-container">
          <button
            className="button enter-button"
            onClick={withClickSound(game, handleEnterStage)}
          >
            <h2>ENTER DREAM</h2>
          </button>
        </div>
      </div>
    </BaseContainer>
  );
};

export default StageSelectionUI;
