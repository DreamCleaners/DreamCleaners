import { useContext } from 'react';
import { GameContext } from '../contexts/GameContext';
import '../styles/pauseMenu.css';
import '../styles/shared.css';
import { withClickSound } from './Utils';

const PauseMenu = () => {
  const game = useContext(GameContext);

  const handleResume = () => {
    game?.resume();
  };

  const handleMainMenu = () => {
    game?.stop();
  };

  return (
    <div className="pause-menu-container">
      <div className="pause-menu-background"></div>
      <div className="pause-menu-content">
        <h1 className="title">PAUSE</h1>
        <div className="pause-menu-buttons-container">
          <div className="pause-menu-buttons-content">
            <button
              className="pause-menu-button"
              onClick={withClickSound(game, handleResume)}
            >
              <h2>RESUME</h2>
            </button>
            <button className="pause-menu-button">
              <h2>PARAMETERS</h2>
            </button>
            <button
              className="pause-menu-button"
              onClick={withClickSound(game, handleMainMenu)}
            >
              <h2>MAIN MENU</h2>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PauseMenu;
