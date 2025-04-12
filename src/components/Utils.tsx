import { Game } from '../lib/game';
import { SoundCategory } from '../lib/sound/soundSystem';

/**
 * Exported method to wrap a click handler with sound effect.
 * Uses proper type safety for React event handlers
 */
export const withClickSound = <E extends React.SyntheticEvent = React.MouseEvent>(
  game: Game | null | undefined,
  onClick?: (event: E) => void,
) => {
  return (event: E) => {
    if (game?.soundManager) {
      // We currently always play the same sound, but we could
      // receive the sound name as a parameter in the future
      // if we want to play different sounds for different buttons
      game.soundManager.playSound('placeholder', SoundCategory.UI);
    }

    // Call the original handler if provided
    if (onClick) {
      onClick(event);
    }
  };
};
