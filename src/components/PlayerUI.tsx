import { useContext, useEffect, useRef, useState } from 'react';
import { GameContext } from '../contexts/GameContext';
import { Weapon } from '../lib/weapons/weapon';
import { Observer } from '@babylonjs/core';
import '../styles/playerUI.css';

const PlayerHUD = () => {
  const game = useContext(GameContext);

  // Health
  const [playerMaxHealth, setPlayerMaxHealth] = useState<number>(0);
  const [playerHealth, setPlayerHealth] = useState<number>(0);

  // Weapon
  const [playerWeapon, setPlayerWeapon] = useState<Weapon | null>(null);
  const [ammo, setAmmo] = useState<number>(0);
  const onAmmoChangeObserverRef = useRef<Observer<number> | null>(null);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const onReloadObserverRef = useRef<Observer<boolean> | null>(null);

  const [playerMoney, setPlayerMoney] = useState<number>(0);

  // Stage Completed
  const [stageCompletedCount, setStageCompletedCount] = useState<number>(0);

  const onWeaponChange = (weapon: Weapon) => {
    if (weapon === undefined) return;
    // remove previous observer so we don't have multiple observers
    onAmmoChangeObserverRef.current?.remove();
    onReloadObserverRef.current?.remove();

    setPlayerWeapon(weapon);

    setAmmo(weapon.currentAmmoRemaining);
    onAmmoChangeObserverRef.current = weapon.onAmmoChange.add(setAmmo);

    setIsReloading(weapon.isReloading);
    onReloadObserverRef.current = weapon.onReload.add(setIsReloading);
  };

  useEffect(() => {
    if (!game) return;

    // set initial values
    setPlayerHealth(game.player.healthController.getHealth());
    setPlayerMaxHealth(game.player.healthController.getMaxHealth());
    setPlayerMoney(game.moneyManager.getPlayerMoney());
    setStageCompletedCount(game.runManager.getStageCompletedCount());
    onWeaponChange(game.player.equippedWeapon);

    // add observers
    const onHealthChangeObserver =
      game.player.healthController.onHealthChange.add(setPlayerHealth);
    const onMaxHealthChangeObserver =
      game.player.healthController.onMaxHealthChange.add(setPlayerMaxHealth);

    const onWeaponChangeObserver = game.player.onWeaponChange.add(onWeaponChange);

    const onPlayerMoneyChangeObserver =
      game.moneyManager.onPlayerMoneyChange.add(setPlayerMoney);

    const onStageCompletedObserver =
      game.runManager.onStageCompletedChange.add(setStageCompletedCount);

    return () => {
      // remove observers when component unmounts
      onHealthChangeObserver.remove();
      onMaxHealthChangeObserver.remove();
      onWeaponChangeObserver.remove();
      onPlayerMoneyChangeObserver.remove();
      onStageCompletedObserver.remove();
      onAmmoChangeObserverRef.current?.remove();
      onReloadObserverRef.current?.remove();
    };
  }, [game]);

  return (
    <div className="hud-container">
      <p>
        Health: {playerHealth} / {playerMaxHealth}
      </p>
      <p>Weapon: {playerWeapon?.weaponName}</p>
      <p>Ammo: {ammo}</p>
      <p>Is reloading: {isReloading ? 'true' : 'false'}</p>
      <p>Money: {playerMoney}$</p>
      <p>Stages cleared: {stageCompletedCount}</p>
    </div>
  );
};

export default PlayerHUD;
