import { useEffect, useRef } from 'react';
import { Game } from '../lib/game';
import '../styles/gameCanvas.css';

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    if (canvasRef.current && !gameRef.current) {
      gameRef.current = new Game();
      gameRef.current.start(canvasRef.current);
    }
  }, [canvasRef]);

  return (
    <>
      <div className="playerCrosshair verticalLine"></div>
      <div className="playerCrosshair horizontalLine"></div>
      <canvas
        ref={canvasRef}
        height={window.innerHeight}
        width={window.innerWidth}
      ></canvas>
    </>
  );
};

export default GameCanvas;
