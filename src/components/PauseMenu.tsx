import { useContext } from 'react';
import { GameContext } from '../contexts/GameContext';
import '../styles/pauseMenu.css';

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
      <button onClick={handleResume}>Resume</button>
      <button onClick={handleMainMenu}>Main Menu</button>
    </div>
  );
};

export default PauseMenu;
