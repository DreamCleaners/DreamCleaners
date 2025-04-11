import { useEffect, useState, useContext } from 'react';
import '../styles/stageSelectionUI.css';
import { StagesManager } from '../lib/stages/stagesManager';
import { GameContext } from '../contexts/GameContext';
import { Rarity } from '../lib/shop/rarity.ts';
import { StageInformation } from '../lib/stages/stageInformation';
import { withClickSound } from './Utils';

const StageSelectionUI = () => {
  const game = useContext(GameContext);
  const [stageInfo, setStageInfo] = useState<StageInformation | null>(null);
  const [stageImagePath, setStageImagePath] = useState<string | null>(null);

  useEffect(() => {
    const stagesManager = StagesManager.getInstance();
    const selectedBedInfo = stagesManager.getSelectedBedInformation();
    setStageInfo(selectedBedInfo);

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
    handleHideUI(); // Hide the UI
    StagesManager.getInstance().enterStage(); // Call enterStage() method
  };

  return (
    <div className="stage-selection-container">
      <div className="back-button-container">
        <button onClick={withClickSound(game, handleHideUI)}>Back</button>
      </div>
      <div className="stage-title-container">
        {stageInfo?.proposedFixedStageLayout || 'Procedural Stage'}
      </div>
      <div className="stage-info-reward-container">
        <div className="stage-info-container">
          {stageInfo ? (
            <ul>
              <li>Difficulty: {stageInfo.difficulty}</li>
              <li>
                Enemies:{' '}
                {stageInfo.enemyTypes.map((enemy) => enemy.toString()).join(', ')}
              </li>
            </ul>
          ) : (
            'Loading stage information...'
          )}
        </div>
        <div className="stage-reward-container">
          <h3 className="stage-reward-title">Stage Reward</h3>
          {stageInfo ? (
            <div className="stage-reward-content">
              {stageInfo.stageReward.getWeaponReward() ? (
                <div className="reward-with-weapon">
                  <span className="reward-money">
                    {stageInfo.stageReward.getMoneyReward() ?? 0} gold
                  </span>
                  <div className="reward-weapon">
                    <span>
                      {`Weapon: ${
                        stageInfo.stageReward
                          .getWeaponReward()
                          ?.weaponType?.toUpperCase() ?? 'Unknown'
                      } of quality: ${
                        Rarity[stageInfo.stageReward.getWeaponReward()?.rarity ?? 0]
                      }`}
                    </span>
                    {(stageInfo.stageReward.getWeaponReward()?.embeddedPassives ?? [])
                      .length > 0 && (
                      <span>
                        This weapon has{' '}
                        {stageInfo.stageReward.getWeaponReward()?.embeddedPassives
                          ?.length ?? 0}{' '}
                        hidden{' '}
                        {stageInfo.stageReward.getWeaponReward()?.embeddedPassives
                          ?.length === 1
                          ? 'passive'
                          : 'passives'}
                        !
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="reward-no-weapon">
                  <span>{stageInfo.stageReward.getMoneyReward() ?? 0} gold</span>
                </div>
              )}
            </div>
          ) : (
            'Loading reward information...'
          )}
        </div>
      </div>
      <div className="stage-description-container">
        <div className="stage-image-container">
          {stageImagePath ? (
            <img
              src={stageImagePath}
              alt={`Stage ${stageInfo?.proposedFixedStageLayout || 'image'}`}
              className="stage-image"
            />
          ) : (
            'Loading stage image...'
          )}
        </div>
        <div className="stage-description-text-container">
          <p>
            {stageInfo && game?.stageInformationManager
              ? game.stageInformationManager.buildStageDescription(stageInfo.enemyTypes)
              : 'Loading stage description...'}
          </p>
        </div>
      </div>
      <div className="select-button-container">
        <button onClick={withClickSound(game, handleEnterStage)}>Enter Stage</button>
      </div>
    </div>
  );
};

export default StageSelectionUI;
