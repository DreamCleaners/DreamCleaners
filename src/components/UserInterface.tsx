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

  useEffect(() => {
    if (!game) return;
    game.uiManager.onUIChange.add(setUIType);

    return () => {
      game.uiManager.onUIChange.removeCallback(setUIType);
    };
  }, [game]);

  return (
    <div className="ui-container">
      {uiType === UIType.MAIN_MENU && <MainMenu />}
      {uiType === UIType.PAUSE_MENU && <PauseMenu />}
      {uiType === UIType.PLAYER_HUD && <PlayerHUD />}
      {uiType === UIType.PLAYER_UPGRADES && <PlayerUpgradeInterface />}
      {uiType === UIType.SCORE && <ScoreInterface />}
    </div>
  );
};

export default UserInterface;
