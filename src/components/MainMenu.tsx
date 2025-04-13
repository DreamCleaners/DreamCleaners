import { useContext } from 'react';
import { GameContext } from '../contexts/GameContext';
import '../styles/mainMenu.css';
import '../styles/shared.css';
import { withClickSound } from './Utils';
import settingsIcon from '../assets/img/settings.png';
import tutorialIcon from '../assets/img/tutorial.png';
import continueIcon from '../assets/img/continue.png';
import newGameIcon from '../assets/img/new-game.png';

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
      <div className="main-menu-container-background"></div>
      <div className="main-menu-container-content">
        <h1 className="title">MAIN MENU</h1>
        <div className="main-menu-buttons-container">
          <div className="main-menu-buttons-content">
            <button
              className="main-menu-button-large main-menu-button"
              onClick={withClickSound(game, handleNewGame)}
            >
              <div className="main-menu-large-button-icon-container">
                <img src={newGameIcon} className="main-menu-large-button-icon" />
              </div>
              <h1 className="main-menu-button-title">NEW GAME</h1>
            </button>
            <button
              className="main-menu-button-large main-menu-button"
              onClick={withClickSound(game, handleContinueGame)}
            >
              <div className="main-menu-large-button-icon-container">
                <img src={continueIcon} className="main-menu-large-button-icon" />
              </div>
              <h1 className="main-menu-button-title">
                {game.saveManager.hasSave() ? 'CONTINUE' : 'NO SAVE'}
              </h1>
            </button>
            <div className="main-menu-right-buttons-container">
              <button className="main-menu-button">
                <div className="main-menu-button-icon-container">
                  <img src={tutorialIcon} className="main-menu-button-icon" />
                </div>
                <h1 className="main-menu-button-title">TUTORIAL</h1>
              </button>
              <button className="main-menu-button">
                <div className="main-menu-button-icon-container">
                  <img
                    src={settingsIcon}
                    className="main-menu-button-icon settings-icon"
                  />
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
