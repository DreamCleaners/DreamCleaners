import { useContext } from 'react';
import '../styles/gameOverUI.css';
import { GameContext } from '../contexts/GameContext';
import { withClickSound } from '../lib/utils/withClickSound';
import BaseContainer from './BaseContainer';

import WilliamTellSkullIcon from '@/assets/icons/william-tell-skull.svg?react';
import StopwatchIcon from '@/assets/icons/stopwatch.svg?react';
import InternalInjuryIcon from '@/assets/icons/internal-injury.svg?react';
import MoneyStackIcon from '@/assets/icons/money-stack.svg?react';
import MagicBroomIcon from '@/assets/icons/magic-broom.svg?react';

const GameOverUI = () => {
  const game = useContext(GameContext);

  const handleCloseUI = () => {
    game?.stop();
  };

  if (!game) return null;

  return (
    <BaseContainer
      title="MISSION FAILED !"
      backButtonCallback={withClickSound(game, handleCloseUI)}
    >
      <div className="game-over-container">
        <h2 className="game-over-text">
          Did I forget to mention dying in the dream results in your death in the real
          life? ... By the way, the customer was unhappy with his dream, you're fired.
        </h2>
        <div className="game-over-stat-container">
          <ul className="game-over-stat-list">
            <li className="game-over-stats-item">
              <div className="game-over-stats-item-title">
                <MagicBroomIcon className="game-over-stats-icon" />
                Dreams Cleaned :
              </div>
              <p className="game-over-stats-item-value">
                {game.runManager.stagesCompletedCount}
              </p>
            </li>
            <li className="game-over-stats-item">
              <div className="game-over-stats-item-title">
                <WilliamTellSkullIcon className="game-over-stats-icon" />
                Total Kill :
              </div>
              <p className="game-over-stats-item-value">{game.runManager.totalKill}</p>
            </li>
            <li className="game-over-stats-item">
              <div className="game-over-stats-item-title">
                <StopwatchIcon className="game-over-stats-icon" />
                Time in dreams :
              </div>
              <p className="game-over-stats-item-value">
                {Math.floor(game.runManager.timeSpentInStage / 60)} min{' '}
                {game.runManager.timeSpentInStage % 60} sec
              </p>
            </li>
            <li className="game-over-stats-item">
              <div className="game-over-stats-item-title">
                <InternalInjuryIcon className="game-over-stats-icon" />
                Total Damage Taken :
              </div>
              <p className="game-over-stats-item-value">
                {game.runManager.totalDamageTaken}
              </p>
            </li>
            <li className="game-over-stats-item">
              <div className="game-over-stats-item-title">
                <MoneyStackIcon className="game-over-stats-icon" />
                Money spent on shop items :
              </div>
              <p className="game-over-stats-item-value">
                {game.runManager.totalMoneySpentOnItems}$
              </p>
            </li>
            <li className="game-over-stats-item">
              <div className="game-over-stats-item-title">
                <MoneyStackIcon className="game-over-stats-icon" />
                Money spent on shop rerolls :
              </div>
              <p className="game-over-stats-item-value">
                {game.runManager.totalMoneySpentOnRerolls}$
              </p>
            </li>
          </ul>
        </div>
      </div>
    </BaseContainer>
  );
};

export default GameOverUI;
