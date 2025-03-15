import { useContext, useEffect } from 'react';
import { GameContext } from '../contexts/GameContext';
import '../styles/scoreInterface.css';

const ScoreInterface = () => {
  const game = useContext(GameContext);

  useEffect(() => {
    if (!game) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        game.uiManager.hideUI();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [game]);

  if (!game) return null;

  return (
    <div className="score-interface-container">
      <h1>Stage score</h1>
      <p>
        <strong>press backspace to skip</strong>
      </p>
      <hr />
      <p>
        Enemies killed: {game.scoreManager.totalKill}, score: +
        {game.scoreManager.totalKillScore}
      </p>
      <p>
        Time elapsed: {game.scoreManager.timeElapsed}s, score: +
        {game.scoreManager.totalTimeBonus}
      </p>
      <p>
        Damage taken: {game.scoreManager.totalDamageTaken}, score: -
        {game.scoreManager.totalDamageTakenMalus}
      </p>
      <h3>Final score: {game.scoreManager.getScore()}</h3>
    </div>
  );
};

export default ScoreInterface;
