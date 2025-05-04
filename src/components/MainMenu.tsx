import { useContext } from 'react';
import { GameContext } from '../contexts/GameContext';
import '../styles/mainMenu.css';
import '../styles/shared.css';
import { withClickSound } from '../lib/utils/withClickSound';

import GraduateCapIcon from '@/assets/icons/graduate-cap.svg?react';
import CogIcon from '@/assets/icons/cog.svg?react';
import BackwardTimeIcon from '@/assets/icons/backward-time.svg?react';
import PlayButtonIcon from '@/assets/icons/play-button.svg?react';
import { UIType } from '../lib/ui/uiType';

const MainMenu = () => {
  const game = useContext(GameContext);

  const handleContinueGame = () => {
    if (game?.saveManager.hasSave()) {
      game?.start(false);
    } else {
      handleNewGame();
    }
  };

  const handleNewGame = () => {
    game?.start(true);
  };

  if (!game) return null;

  return (
    <div className="main-menu-container">
      <div className="main-background"></div>
      <div className="main-content">
        <div className="top-buttons-container">
          <h1 className="main-title">MAIN MENU</h1>
        </div>
        <div className="main-menu-buttons-container">
          <div className="main-menu-buttons-content">
            <button
              className="main-menu-button-large main-menu-button"
              onClick={withClickSound(game, handleNewGame)}
            >
              <div className="main-menu-large-button-icon-container">
                <PlayButtonIcon className="main-menu-large-button-icon" />
              </div>
              <h1 className="main-menu-button-title">NEW GAME</h1>
            </button>
            <button
              className="main-menu-button-large main-menu-button"
              onClick={withClickSound(game, handleContinueGame)}
            >
              <div className="main-menu-large-button-icon-container">
                <BackwardTimeIcon className="main-menu-large-button-icon" />
              </div>
              <h1 className="main-menu-button-title">
                {game.saveManager.hasSave() ? 'CONTINUE' : 'NO SAVE'}
              </h1>
            </button>
            <div className="main-menu-right-buttons-container">
              <button className="main-menu-button">
                <div className="main-menu-button-icon-container">
                  <GraduateCapIcon className="main-menu-button-icon" />
                </div>
                <h1 className="main-menu-button-title">TUTORIAL</h1>
              </button>
              <button
                className="main-menu-button"
                onClick={withClickSound(game, () =>
                  game.uiManager.displayUI(UIType.SETTINGS),
                )}
              >
                <div className="main-menu-button-icon-container">
                  <CogIcon className="main-menu-button-icon settings-icon" />
                </div>
                <h1 className="main-menu-button-title">SETTINGS</h1>
              </button>
            </div>
          </div>
        </div>
        <h4 className="main-menu-version">v{game.VERSION}</h4>
      </div>
    </div>
  );
};

export default MainMenu;
