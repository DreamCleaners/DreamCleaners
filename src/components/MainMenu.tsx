import { useContext } from 'react';
import { GameContext } from '../contexts/GameContext';
import '../styles/mainMenu.css';

const MainMenu = () => {
  const game = useContext(GameContext);

  const handleContinueGame = () => {
    game?.start(false);
  };

  const handleNewGame = () => {
    game?.start(true);
  };

  if (!game) return null;

  return (
    <div className="main-menu-container">
      <h1>Dream Cleaners</h1>
      {game.saveManager.hasSave() && (
        <button onClick={handleContinueGame}>Continue Game</button>
      )}
      <button onClick={handleNewGame}>New Game</button>
      <p>Version {game.VERSION}</p>
    </div>
  );
};

export default MainMenu;
