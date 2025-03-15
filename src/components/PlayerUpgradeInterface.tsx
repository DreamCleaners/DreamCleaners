import { useContext, useEffect, useState } from 'react';
import { GameContext } from '../contexts/GameContext';
import { PlayerUpgradeType } from '../lib/player/playerUpgradeType';
import { PlayerUpgrade } from '../lib/player/playerUpgrade';
import '../styles/playerUpgradeInterface.css';

const PlayerUpgradeInterface = () => {
  const game = useContext(GameContext);

  const [playerMoney, setPlayerMoney] = useState<number>(0);
  const [playerUpgrades, setPlayerUpgrades] = useState<
    Map<PlayerUpgradeType, PlayerUpgrade>
  >(new Map());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        game?.uiManager.hideUI();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const onPlayerUpgradeChange = () => {
      if (!game) return;
      setPlayerUpgrades(game.player.playerUpgradeManager.getAllPlayerUpgrades());
    };

    if (!game) return;

    // set initial values
    setPlayerMoney(game.moneyManager.getPlayerMoney());
    setPlayerUpgrades(game.player.playerUpgradeManager.getAllPlayerUpgrades());

    // initialize observers
    const onPlayerMoneyChangeObserver =
      game.moneyManager.onPlayerMoneyChange.add(setPlayerMoney);

    const onPlayerUpgradeChangeObserver =
      game.player.playerUpgradeManager.onPlayerUpgradeChange.add(onPlayerUpgradeChange);
    const onPlayerUpgradeUnlockObserver =
      game.player.playerUpgradeManager.onPlayerUpgradeUnlock.add(onPlayerUpgradeChange);

    return () => {
      // remove observers when component unmounts
      window.removeEventListener('keydown', handleKeyDown);

      if (!game) return;

      onPlayerMoneyChangeObserver.remove();
      onPlayerUpgradeChangeObserver.remove();
      onPlayerUpgradeUnlockObserver.remove();
    };
  }, [game]);

  if (!game) return null;

  return (
    <div className="player-upgrade-interface-container">
      <h1>Player Upgrades</h1>
      <p>
        <strong>press backspace to close</strong>
      </p>
      <p>Money: {playerMoney}$</p>
      {Array.from(playerUpgrades).map(([upgradeType, upgrade]) => (
        <div key={upgradeType}>
          <hr />
          <h2>{upgrade.upgradeName}</h2>
          <p>{upgrade.description}</p>
          {!game.player.playerUpgradeManager.isUpgradeUnlocked(upgradeType) ? (
            <button
              onClick={game.player.playerUpgradeManager.unlockUpgrade.bind(
                game.player.playerUpgradeManager,
                upgradeType,
              )}
              disabled={playerMoney < upgrade.unlockCost}
            >
              Buy ({upgrade.unlockCost}$)
            </button>
          ) : (
            <>
              <p>
                Current {upgrade.upgradeName}:{' '}
                {upgrade.upgradesValue[upgrade.currentUpgradeIndex]} (
                {upgrade.currentUpgradeIndex + 1}/{upgrade.upgradesValue.length})
              </p>
              {!game.player.playerUpgradeManager.isMaxUpgrade(upgradeType) ? (
                <>
                  <p>
                    Next Upgrade: {upgrade.upgradesValue[upgrade.currentUpgradeIndex + 1]}
                  </p>
                  <button
                    onClick={game.player.playerUpgradeManager.upgrade.bind(
                      game.player.playerUpgradeManager,
                      upgradeType,
                    )}
                    disabled={
                      playerMoney < upgrade.upgradesCost[upgrade.currentUpgradeIndex]
                    }
                  >
                    Upgrade ({upgrade.upgradesCost[upgrade.currentUpgradeIndex]}$)
                  </button>
                </>
              ) : null}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default PlayerUpgradeInterface;
