import { useEffect, useRef, useState } from 'react';
import { Game } from '../lib/game';
import '../styles/gameCanvas.css';
import UserInterface from './UserInterface';
import { GameContext } from '../contexts/GameContext';
import { Observer } from '@babylonjs/core';
import { Weapon } from '../lib/weapons/weapon';

const CROSSHAIR_SIZE = 32;

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const gameRef = useRef<Game | null>(null);
  const [isCrosshairVisible, setIsCrosshairVisible] = useState<boolean>(false);
  const [isBloodScreenVisible, setIsBloodScreenVisible] = useState<boolean>(false);
  const [currentWeapon, setCurrentWeapon] = useState<Weapon | null>(null);

  const onCrosshairChangeObserverRef = useRef<Observer<boolean> | null>(null);
  const onBloodScreenChangeObserverRef = useRef<Observer<boolean> | null>(null);
  const onWeaponChangeObserverRef = useRef<Observer<Weapon> | null>(null);

  const initGame = async () => {
    gameRef.current = new Game();
    await gameRef.current.init(canvasRef.current!);
    setGame(gameRef.current);

    onCrosshairChangeObserverRef.current =
      gameRef.current.uiManager.onCrosshairChange.add(setIsCrosshairVisible);

    onBloodScreenChangeObserverRef.current =
      gameRef.current.uiManager.onBloodScreenChange.add(setIsBloodScreenVisible);

    onWeaponChangeObserverRef.current = gameRef.current.player.onWeaponChange.add(
      (weapon: Weapon) => {
        setCurrentWeapon(weapon);
      },
    );
  };

  useEffect(() => {
    if (canvasRef.current && !gameRef.current) {
      initGame();
    }

    return () => {
      if (gameRef.current) {
        onCrosshairChangeObserverRef.current?.remove();
        onBloodScreenChangeObserverRef.current?.remove();
        onWeaponChangeObserverRef.current?.remove();
      }
    };
  }, []);

  return (
    <GameContext.Provider value={game}>
      {isCrosshairVisible && currentWeapon !== null && (
        <img
          className="player-crosshair"
          src={`./img/crosshairs/${currentWeapon.weaponData.crosshair.name}.png`}
          style={{
            width: CROSSHAIR_SIZE * currentWeapon.weaponData.crosshair.scale,
            height: CROSSHAIR_SIZE * currentWeapon.weaponData.crosshair.scale,
          }}
        />
      )}
      <div className={`blood-screen ${isBloodScreenVisible ? 'show' : ''}`}></div>
      <UserInterface />
      <canvas
        ref={canvasRef}
        height={window.innerHeight}
        width={window.innerWidth}
      ></canvas>
    </GameContext.Provider>
  );
};

export default GameCanvas;
