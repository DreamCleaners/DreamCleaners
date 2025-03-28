import { useEffect, useState, useContext } from 'react';
import '../styles/stageSelectionUI.css';
import { StagesManager } from '../lib/stages/stagesManager';
import { GameContext } from '../contexts/GameContext';
import { WeaponRarity } from '../lib/weapons/weaponRarity';
import { StageInformation } from '../lib/stages/stageInformation';

const StageSelectionUI = () => {
  const game = useContext(GameContext);
  const [stageInfo, setStageInfo] = useState<StageInformation | null>(null);

  useEffect(() => {
    const stagesManager = StagesManager.getInstance();
    const selectedBedInfo = stagesManager.getSelectedBedInformation();
    setStageInfo(selectedBedInfo);
  }, []);

  const handleHideUI = () => {
    game?.uiManager.hideUI();
  };

  return (
    <div className="stage-selection-container">
      <div className="back-button-container">
        <button onClick={handleHideUI}>Back</button>
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
                    {stageInfo.stageReward.getMoneyReward()} gold
                  </span>
                  <div className="reward-weapon">
                    <span>A random weapon of quality:</span>
                    <span>
                      {WeaponRarity[stageInfo.stageReward.getWeaponReward()?.rarity || 0]}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="reward-no-weapon">
                  <span>{stageInfo.stageReward.getMoneyReward()} gold</span>
                </div>
              )}
            </div>
          ) : (
            'Loading reward information...'
          )}
        </div>
      </div>
      <div className="stage-description-container">
        <div className="stage-image-container">Stage Image Container</div>
        <div className="stage-description-text-container">
          Stage Description Text Container
        </div>
      </div>
      <div className="select-button-container">
        <button
          onClick={() => {
            handleHideUI(); // Hide the UI
            StagesManager.getInstance().enterStage(); // Call enterStage() method
          }}
        >
          Enter Stage
        </button>
      </div>
    </div>
  );
};

export default StageSelectionUI;
