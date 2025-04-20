import { useContext } from 'react';
import '../styles/gameOverUI.css';
import { GameContext } from '../contexts/GameContext';
import { withClickSound } from '../lib/utils/withClickSound';

const GameOverUI = () => {
  const game = useContext(GameContext); // Access the game instance from the context

  return (
    <div className="game-over-container">
      <h1>
        Game Over! Did I forget to mention dying in the dream results in your death in the
        real life? ... By the way, the customer was unhappy with his dream, you're fired.
      </h1>
      <button onClick={withClickSound(game, () => game?.stop())}>
        Back to Main Menu
      </button>
    </div>
  );
};

export default GameOverUI;
