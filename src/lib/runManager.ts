import { Observable } from '@babylonjs/core/Misc/observable';
import { ISaveable } from './saveable';

/** A run is a game session, a playthrough or an "attempt" in the roguelike/roguelite jargon */
export class RunManager implements ISaveable {
  // Stores the amount of stages completed
  // Shall be used for proposed stages difficulty scaling
  public stagesCompletedCount: number = 0;
  public onStageCompletedChange = new Observable<number>();

  public incrementStageCompleted(): void {
    this.stagesCompletedCount++;
    this.onStageCompletedChange.notifyObservers(this.stagesCompletedCount);
  }

  public getStageCompletedCount(): number {
    return this.stagesCompletedCount;
  }

  public save(): string {
    return JSON.stringify(this.stagesCompletedCount);
  }

  public restoreSave(data: string): void {
    this.stagesCompletedCount = JSON.parse(data);
  }

  public resetSave(): void {
    this.stagesCompletedCount = 0;
  }
}
