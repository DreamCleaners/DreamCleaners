import { useContext } from 'react';
import { GameContext } from '../contexts/GameContext';
import '../styles/pauseMenu.css';
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
      <h1>Pause Menu</h1>
      <button onClick={withClickSound(game, handleResume)}>Resume</button>
      <button onClick={withClickSound(game, handleMainMenu)}>Main Menu</button>
    </div>
  );
};

export default PauseMenu;
