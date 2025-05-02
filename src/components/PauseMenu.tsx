import { useContext } from 'react';
import { GameContext } from '../contexts/GameContext';
import '../styles/pauseMenu.css';
import '../styles/shared.css';
import { withClickSound } from '../lib/utils/withClickSound';
import BaseContainer from './BaseContainer';

const PauseMenu = () => {
  const game = useContext(GameContext);

  const handleResume = () => {
    game?.resume();
  };

  const handleMainMenu = () => {
    game?.stop();
  };

  return (
    <BaseContainer title="PAUSE">
      <div className="pause-menu-buttons-container">
        <div className="pause-menu-buttons-content">
          <button
            className="pause-menu-button button"
            onClick={withClickSound(game, handleResume)}
          >
            <h2>RESUME</h2>
          </button>
          <button className="pause-menu-button button">
            <h2>SETTINGS</h2>
          </button>
          <button
            className="pause-menu-button button"
            onClick={withClickSound(game, handleMainMenu)}
          >
            <h2>MAIN MENU</h2>
          </button>
        </div>
      </div>
    </BaseContainer>
  );
};

export default PauseMenu;
