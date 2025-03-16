import { Observable } from '@babylonjs/core';
import { Game } from '../game';
import { UIType } from './uiType';

export class UIManager {
  private currentUI: UIType = UIType.PLAYER_HUD;

  onUIChange: Observable<UIType> = new Observable<UIType>();
  onCrosshairChange: Observable<boolean> = new Observable<boolean>();

  // used to store last active state to restore it after a pause
  private lastActiveUI: UIType = UIType.PLAYER_HUD;
  private lastActivePointerLock = false;

  constructor(private game: Game) {}

  public displayUI(uiType: UIType): void {
    if (this.currentUI === uiType) return;

    this.setCurrentUI(uiType);

    if (uiType !== UIType.PLAYER_HUD) {
      this.game.unlockPointer();
      this.game.player.freezePlayer();

      // prevent player from locking pointer when UI is displayed
      this.game.canPlayerLockPointer = false;

      this.setCrosshairVisibility(false);
      this.saveLastActiveUIState(false);
    } else {
      this.saveLastActiveUIState(true);
    }
  }

  public hideUI(): void {
    this.setCurrentUI(UIType.PLAYER_HUD);
    this.setCrosshairVisibility(true);

    this.game.canPlayerLockPointer = true;
    this.game.lockPointer();

    this.saveLastActiveUIState(true);
  }

  public displayPauseMenu(): void {
    if (this.currentUI === UIType.PAUSE_MENU) return;

    this.setCurrentUI(UIType.PAUSE_MENU);
    this.setCrosshairVisibility(false);
  }

  public hidePauseMenu(): void {
    this.restoreLastActiveUIState();
  }

  public setCrosshairVisibility(isVisible: boolean): void {
    this.onCrosshairChange.notifyObservers(isVisible);
  }

  public getCurrentUI(): UIType {
    return this.currentUI;
  }

  public setCurrentUI(uiType: UIType): void {
    this.currentUI = uiType;
    this.onUIChange.notifyObservers(uiType);
  }

  private saveLastActiveUIState(isPointerLocked: boolean): void {
    this.lastActiveUI = this.currentUI;
    this.lastActivePointerLock = isPointerLocked;
  }

  private restoreLastActiveUIState(): void {
    this.setCurrentUI(this.lastActiveUI);
    this.setCrosshairVisibility(this.lastActivePointerLock);

    if (this.lastActivePointerLock) {
      this.game.lockPointer();
    }
  }
}
