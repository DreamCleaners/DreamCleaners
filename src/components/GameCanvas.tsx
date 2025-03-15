import { useEffect, useRef, useState } from 'react';
import { Game } from '../lib/game';
import '../styles/gameCanvas.css';
import UserInterface from './UserInterface';
import { GameContext } from '../contexts/GameContext';
import { Observer } from '@babylonjs/core';

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const gameRef = useRef<Game | null>(null);
  const [isCrosshairVisible, setIsCrosshairVisible] = useState<boolean>(true);
  const onCrosshairChangeObserverRef = useRef<Observer<boolean> | null>(null);

  const initGame = async () => {
    gameRef.current = new Game();
    await gameRef.current.start(canvasRef.current!);
    setGame(gameRef.current);

    onCrosshairChangeObserverRef.current =
      gameRef.current.uiManager.onCrosshairChange.add(setIsCrosshairVisible);
  };

  useEffect(() => {
    if (canvasRef.current && !gameRef.current) {
      initGame();
    }

    return () => {
      if (gameRef.current) {
        onCrosshairChangeObserverRef.current?.remove();
      }
    };
  }, []);

  return (
    <GameContext.Provider value={game}>
      {isCrosshairVisible && (
        <>
          <div className="playerCrosshair verticalLine"></div>
          <div className="playerCrosshair horizontalLine"></div>
        </>
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
