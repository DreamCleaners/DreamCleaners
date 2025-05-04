import { useContext, useState } from 'react';
import BaseContainer from './BaseContainer';
import { GameContext } from '../contexts/GameContext';
import { withClickSound } from '../lib/utils/withClickSound';
import { UIType } from '../lib/ui/uiType';
import '../styles/settingsUI.css';

const SettingsUI = () => {
  const game = useContext(GameContext);
  const [sensivity, setSensivity] = useState(
    game?.player.cameraManager.getCameraSensivity() ?? 0.5,
  );

  const handleSensivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!game) return;

    const value = parseFloat(e.target.value);
    setSensivity(value);

    game.player.cameraManager.setCameraSensivity(value);
    game.saveManager.save();
  };

  const handleHideUI = () => {
    game?.uiManager.setCurrentUI(UIType.MAIN_MENU);
  };

  if (!game) return null;

  return (
    <BaseContainer
      title="SETTINGS"
      backButtonCallback={withClickSound(game, handleHideUI)}
    >
      <div className="settings-menu-container">
        <div className="settings-menu-background"></div>
        <div className="settings-menu-content">
          <div className="settings-menu-item">
            <h2>Sensivity</h2>
            <div className="settings-menu-item-content">
              <h2>{sensivity}</h2>
              <input
                type="range"
                min="0.01"
                max="1"
                defaultValue={sensivity}
                step="0.01"
                onChange={handleSensivityChange}
              />
            </div>
          </div>
        </div>
      </div>
    </BaseContainer>
  );
};

export default SettingsUI;
