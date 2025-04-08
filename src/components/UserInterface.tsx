import { useContext, useEffect, useState } from 'react';
import '../styles/userInterface.css';
import PlayerHUD from './PlayerUI';
import { GameContext } from '../contexts/GameContext';
import { UIType } from '../lib/ui/uiType';
import MainMenu from './MainMenu';
import PauseMenu from './PauseMenu';
import GameOverUI from './GameOverUI';
import StageSelectionUI from './StageSelectionUI';
import StageEndUI from './StageEndUI';
import ComputerUI from './ComputerUI';
import WorkbenchUI from './WorkbenchUI';

const UserInterface = () => {
  const game = useContext(GameContext);
  const [uiType, setUIType] = useState<UIType>(UIType.MAIN_MENU);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!game) return;
    game.uiManager.onUIChange.add(setUIType);
    game.uiManager.onPauseMenuChange.add(setIsPaused);

    return () => {
      game.uiManager.onUIChange.removeCallback(setUIType);
      game.uiManager.onPauseMenuChange.removeCallback(setIsPaused);
    };
  }, [game]);

  return (
    <div className="ui-container">
      {isPaused && <PauseMenu />}
      {uiType === UIType.MAIN_MENU && <MainMenu />}
      {uiType === UIType.PLAYER_HUD && <PlayerHUD />}
      {uiType === UIType.COMPUTER && <ComputerUI />}
      {uiType === UIType.SCORE && <StageEndUI />}
      {uiType === UIType.STAGE_SELECTION && <StageSelectionUI />}
      {uiType === UIType.GAME_OVER && <GameOverUI />}
      {uiType === UIType.WORKBENCH && <WorkbenchUI />}
    </div>
  );
};

export default UserInterface;
