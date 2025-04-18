import { useEffect, useRef, useState } from 'react';
import { Game } from '../lib/game';
import '../styles/gameCanvas.css';
import UserInterface from './UserInterface';
import { GameContext } from '../contexts/GameContext';
import { Observer } from '@babylonjs/core';
import { Weapon } from '../lib/weapons/weapon';

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const gameRef = useRef<Game | null>(null);
  const [isCrosshairVisible, setIsCrosshairVisible] = useState<boolean>(false);
  const [crosshairName, setCrosshairName] = useState<string>('crosshair-glock');

  const onCrosshairChangeObserverRef = useRef<Observer<boolean> | null>(null);
  const onWeaponChangeObserverRef = useRef<Observer<Weapon> | null>(null);

  const initGame = async () => {
    gameRef.current = new Game();
    await gameRef.current.init(canvasRef.current!);
    setGame(gameRef.current);

    onCrosshairChangeObserverRef.current =
      gameRef.current.uiManager.onCrosshairChange.add(setIsCrosshairVisible);

    onWeaponChangeObserverRef.current = gameRef.current.player.onWeaponChange.add(
      (weapon: Weapon) => {
        setCrosshairName(weapon.weaponData.crosshairName);
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
        onWeaponChangeObserverRef.current?.remove();
      }
    };
  }, []);

  return (
    <GameContext.Provider value={game}>
      {isCrosshairVisible && (
        <img
          className="player-crosshair"
          src={`/src/assets/img/cursors/${crosshairName}.png`}
        />
      )}
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
