import { useState } from 'react';
import GameCanvas from '../components/GameCanvas';

const MainMenu = () => {
  const [showGame, setShowGame] = useState(false);

  const handleStartGame = () => {
    setShowGame(true);
  };

  if (showGame) {
    return <GameCanvas />;
  }

  return (
    <div>
      <h1>Dream Cleaners</h1>
      <button onClick={handleStartGame}>Start Game</button>
    </div>
  );
};
export default MainMenu;
