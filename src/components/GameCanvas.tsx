import { useEffect, useRef } from 'react';
import { Game } from '../lib/game';

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
    <canvas
      ref={canvasRef}
      height={window.innerHeight}
      width={window.innerWidth}
    ></canvas>
  );
};

export default GameCanvas;
