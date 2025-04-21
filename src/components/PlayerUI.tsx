import { useContext, useEffect, useRef, useState } from 'react';
import { GameContext } from '../contexts/GameContext';
import { Weapon } from '../lib/weapons/weapon';
import { Observer } from '@babylonjs/core';
import '../styles/playerUI.css';

import HeavyBulletsIcon from '@/assets/icons/heavy-bullets.svg?react';
import HealthIcon from '@/assets/icons/health.svg?react';

const PlayerHUD = () => {
  const game = useContext(GameContext);

  // Health
  const [playerMaxHealth, setPlayerMaxHealth] = useState<number>(0);
  const [playerHealth, setPlayerHealth] = useState<number>(0);

  // Weapon
  const [ammo, setAmmo] = useState<number>(0);
  const onAmmoChangeObserverRef = useRef<Observer<number> | null>(null);

  const [timer, setTimer] = useState<string>('00:00:00');
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  const onWeaponChange = (weapon: Weapon) => {
    if (weapon === undefined) return;
    // remove previous observer so we don't have multiple observers
    onAmmoChangeObserverRef.current?.remove();

    setAmmo(weapon.currentAmmoRemaining);
    onAmmoChangeObserverRef.current = weapon.onAmmoChange.add(setAmmo);
  };

  const updateTimer = (timer: number) => {
    const hours = Math.floor((timer / 3600) % 24);
    const minutes = Math.floor((timer / 60) % 60);
    const seconds = Math.floor(timer % 60);

    const formattedHours = String(hours).padStart(1, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    setTimer(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
  };

  useEffect(() => {
    if (!game) return;

    // set initial values
    setPlayerHealth(game.player.healthController.getHealth());
    setPlayerMaxHealth(game.player.healthController.getMaxHealth());
    onWeaponChange(game.player.equippedWeapon);

    // add observers
    const onHealthChangeObserver =
      game.player.healthController.onHealthChange.add(setPlayerHealth);
    const onMaxHealthChangeObserver =
      game.player.healthController.onMaxHealthChange.add(setPlayerMaxHealth);

    const onWeaponChangeObserver = game.player.onWeaponChange.add(onWeaponChange);

    const onStageStateChangeObserver =
      game.scoreManager.onStateChange.add(setIsTimerRunning);
    const onTimerChangeObserver = game.scoreManager.onTimerChange.add(updateTimer);

    return () => {
      // remove observers when component unmounts
      onHealthChangeObserver.remove();
      onMaxHealthChangeObserver.remove();
      onWeaponChangeObserver.remove();
      onAmmoChangeObserverRef.current?.remove();
      onStageStateChangeObserver.remove();
      onTimerChangeObserver.remove();
    };
  }, [game]);

  return (
    <div className="hud-container">
      {isTimerRunning && (
        <div className="hud-timer-container">
          <h2 className="hud-timer">{timer}</h2>
        </div>
      )}
      <div className="hud-bottom-container">
        <div className="hud-health-container">
          <div className="hud-health">
            <HealthIcon className="hud-health-icon" />
            <div
              className="hud-health-bar"
              style={{ width: `${(playerHealth / playerMaxHealth) * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="hud-weapon">
          <div className="hud-ammo">
            <h2>{ammo}</h2>
            <HeavyBulletsIcon className="hud-ammo-icon" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerHUD;
