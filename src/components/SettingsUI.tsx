import { useContext, useState } from 'react';
import BaseContainer from './BaseContainer';
import { GameContext } from '../contexts/GameContext';
import { withClickSound } from '../lib/utils/withClickSound';
import { UIType } from '../lib/ui/uiType';
import '../styles/settingsUI.css';
import { SoundCategory } from '../lib/sound/soundManager';

const SettingsUI = () => {
  const game = useContext(GameContext);
  const [sensivity, setSensivity] = useState(
    game?.player.cameraManager.getCameraSensivity() ?? 0.5,
  );
  const [masterVolume, setMasterVolume] = useState(
    game?.soundManager.getGlobalVolume() ?? 0.5,
  );

  const handleSensivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!game) return;

    const value = parseFloat(e.target.value);
    setSensivity(value);

    game.player.cameraManager.setCameraSensivity(value);
  };

  // Master volume handler
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!game) return;

    const value = parseFloat(e.target.value);
    setMasterVolume(value);

    game?.soundManager.setGlobalVolume(value);
  };

  // Add handler for slider release
  const handleSliderRelease = () => {
    if (!game) return;
    game.soundManager.playSound('placeholder', SoundCategory.UI);
  };

  const handleHideUI = () => {
    game?.uiManager.setCurrentUI(UIType.MAIN_MENU);
  };

  // Format value as percentage where 0 is 0% and 2 is 100%
  const formatAsPercentage = (value: number): string => {
    return `${Math.round((value / 2) * 100)}%`;
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
                onMouseUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
              />
            </div>
          </div>
          <div className="settings-menu-item">
            <h2>Sound volume</h2>
            <div className="settings-menu-item-content">
              <h2>{formatAsPercentage(masterVolume)}</h2>
              <input
                type="range"
                min="0"
                max="2"
                defaultValue={masterVolume}
                step="0.01"
                onChange={handleVolumeChange}
                onMouseUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
              />
            </div>
          </div>
        </div>
      </div>
    </BaseContainer>
  );
};

export default SettingsUI;
