import { useContext, useEffect, useState } from 'react';
import '../styles/userInterface.css';
import PlayerHUD from './PlayerHUD';
import { GameContext } from '../contexts/GameContext';
import PlayerUpgradeInterface from './PlayerUpgradeInterface';
import { UIType } from '../lib/uiManager';

const UserInterface = () => {
  const game = useContext(GameContext);
  const [uiType, setUIType] = useState<UIType>(UIType.PLAYER_HUD);

  useEffect(() => {
    if (!game) return;
    game.uiManager.onUIChange.add(setUIType);

    return () => {
      game.uiManager.onUIChange.removeCallback(setUIType);
    };
  }, [game]);

  return (
    <div className="uiContainer">
      {uiType === UIType.PLAYER_HUD && <PlayerHUD />}
      {uiType === UIType.PLAYER_UPGRADES && <PlayerUpgradeInterface />}
    </div>
  );
};

export default UserInterface;
