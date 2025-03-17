import { useContext, useEffect, useState } from 'react';
import '../styles/userInterface.css';
import PlayerHUD from './PlayerHUD';
import { GameContext } from '../contexts/GameContext';
import PlayerUpgradeInterface from './PlayerUpgradeInterface';
import { UIType } from '../lib/ui/uiType';
import ScoreInterface from './ScoreInterface';
import MainMenu from './MainMenu';
import PauseMenu from './PauseMenu';

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
      {uiType === UIType.PLAYER_UPGRADES && <PlayerUpgradeInterface />}
      {uiType === UIType.SCORE && <ScoreInterface />}
    </div>
  );
};

export default UserInterface;
