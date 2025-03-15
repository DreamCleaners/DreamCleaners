import { Observable } from '@babylonjs/core';
import { Game } from '../game';
import { UIType } from './uiType';

export class UIManager {
  private currentUI: UIType = UIType.PLAYER_HUD;
  onUIChange: Observable<UIType> = new Observable<UIType>();
  onCrosshairChange: Observable<boolean> = new Observable<boolean>();

  constructor(private game: Game) {}

  public displayUI(uiType: UIType): void {
    if (this.currentUI === uiType) return;
    this.currentUI = uiType;
    this.onUIChange.notifyObservers(uiType);

    if (uiType !== UIType.PLAYER_HUD) {
      this.game.unlockPointer();
      this.game.player.freezePlayer();

      // prevent player from locking pointer when UI is displayed
      this.game.canPlayerLockPointer = false;

      this.toggleCrosshairVisibility(false);
    }
  }

  public hideUI(): void {
    this.currentUI = UIType.PLAYER_HUD;
    this.onUIChange.notifyObservers(UIType.PLAYER_HUD);
    this.toggleCrosshairVisibility(true);
    this.game.canPlayerLockPointer = true;
    this.game.lockPointer();
  }

  public toggleCrosshairVisibility(isVisible: boolean): void {
    this.onCrosshairChange.notifyObservers(isVisible);
  }
}
