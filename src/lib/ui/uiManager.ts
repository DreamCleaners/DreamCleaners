import { Observable } from '@babylonjs/core';
import { Game } from '../game';
import { UIType } from './uiType';

export class UIManager {
  private currentUI: UIType = UIType.PLAYER_HUD;

  onUIChange: Observable<UIType> = new Observable<UIType>();
  onPauseMenuChange: Observable<boolean> = new Observable<boolean>();
  onSettingsMenuChange: Observable<boolean> = new Observable<boolean>();
  onCrosshairChange: Observable<boolean> = new Observable<boolean>();

  // used to store last active state to restore it after a pause
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

  public displaySettingsMenu(): void {
    this.onSettingsMenuChange.notifyObservers(true);
  }

  public hideSettingsMenu(): void {
    this.onSettingsMenuChange.notifyObservers(false);
  }

  public displayPauseMenu(): void {
    this.onPauseMenuChange.notifyObservers(true);
    this.setCrosshairVisibility(false);
  }

  public hidePauseMenu(): void {
    this.onPauseMenuChange.notifyObservers(false);
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
    this.lastActivePointerLock = isPointerLocked;
  }

  private restoreLastActiveUIState(): void {
    this.setCrosshairVisibility(this.lastActivePointerLock);

    if (this.lastActivePointerLock) {
      this.game.lockPointer();
    }
  }
}
