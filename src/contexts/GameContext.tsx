import { createContext } from 'react';
import { Game } from '../lib/game';

export const GameContext = createContext<Game | null>(null);
