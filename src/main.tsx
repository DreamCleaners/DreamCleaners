import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import GameCanvas from './components/GameCanvas.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameCanvas />
  </StrictMode>,
);
