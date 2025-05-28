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

  const [timer, setTimer] = useState<string>('0:00:00');
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Notification system (message on the UI)
  const [notification, setNotification] = useState<string>('');
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationExiting, setNotificationExiting] = useState<boolean>(false);

  // Refs for tracking notification timeouts
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notificationExitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [fps, setFPS] = useState<number>(60);

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

    const onFPSChangeObserver = game.onFPSChange.add(setFPS);

    const onNotificationObserver = game.uiManager.onNotification.add(
      (message: string) => {
        // Clear any existing timeouts
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
          notificationTimeoutRef.current = null;
        }
        if (notificationExitTimeoutRef.current) {
          clearTimeout(notificationExitTimeoutRef.current);
          notificationExitTimeoutRef.current = null;
        }

        setNotification(message);
        setShowNotification(true);
        setNotificationExiting(false);

        notificationTimeoutRef.current = setTimeout(() => {
          setNotificationExiting(true);

          notificationExitTimeoutRef.current = setTimeout(() => {
            setShowNotification(false);
            setNotificationExiting(false);
          }, 600);
        }, 12000);
      },
    );

    const onDismissNotificationObserver = game.uiManager.onDismissNotification.add(() => {
      // Clear any existing timeouts
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
        notificationTimeoutRef.current = null;
      }
      if (notificationExitTimeoutRef.current) {
        clearTimeout(notificationExitTimeoutRef.current);
        notificationExitTimeoutRef.current = null;
      }

      setNotificationExiting(true);

      notificationExitTimeoutRef.current = setTimeout(() => {
        setShowNotification(false);
        setNotificationExiting(false);
      }, 600);
    });

    return () => {
      // remove observers when component unmounts
      onHealthChangeObserver.remove();
      onMaxHealthChangeObserver.remove();
      onWeaponChangeObserver.remove();
      onAmmoChangeObserverRef.current?.remove();
      onStageStateChangeObserver.remove();
      onTimerChangeObserver.remove();
      onFPSChangeObserver.remove();
      onNotificationObserver.remove();
      onDismissNotificationObserver.remove();

      // Clear any active timeouts
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      if (notificationExitTimeoutRef.current) {
        clearTimeout(notificationExitTimeoutRef.current);
      }
    };
  }, [game]); // No need to add showNotification as a dependency

  return (
    <div className="hud-container">
      {showNotification && (
        <div className={`hud-notification ${notificationExiting ? 'exit' : ''}`}>
          <h3>{notification}</h3>
        </div>
      )}
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
              className="hud-health-bar-container"
              style={{
                width: '100%',
                height: '45%',
                borderRadius: '5px',
                position: 'relative',
              }}
            >
              <div
                className="hud-health-bar"
                style={{
                  width: `${(playerHealth / playerMaxHealth) * 100}%`,
                  position: 'absolute',
                  height: '100%',
                }}
              ></div>
            </div>
          </div>
        </div>
        <div className="hud-weapon">
          <div className="hud-ammo">
            <h2>{ammo}</h2>
            <HeavyBulletsIcon className="hud-ammo-icon" />
          </div>
        </div>
      </div>
      {game?.isFPSVisible() && (
        <div className="hud-fps">
          <h3>FPS : {fps.toFixed(0)}</h3>
        </div>
      )}
    </div>
  );
};

export default PlayerHUD;
