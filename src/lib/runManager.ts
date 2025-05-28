import { Observable } from '@babylonjs/core/Misc/observable';
import { ISaveable } from './saveable';

/** A run is a game session, a playthrough or an "attempt" in the roguelike/roguelite jargon */
export class RunManager implements ISaveable {
  // Stores the amount of stages completed
  // Shall be used for proposed stages difficulty scaling
  public stagesCompletedCount: number = 0;
  public onStageCompletedChange = new Observable<number>();

  // Various stats related to the run
  public totalKill: number = 0;
  public onTotalKillChange = new Observable<number>();

  public totalDamageTaken: number = 0;
  public onTotalDamageTakenChange = new Observable<number>();

  public timeSpentInStage: number = 0; // in seconds
  public onTimeSpentInStageChange = new Observable<number>();

  public totalMoneySpentOnItems: number = 0;
  public onTotalMoneySpentOnItemsChange = new Observable<number>();

  public totalMoneySpentOnRerolls: number = 0;
  public onTotalMoneySpentOnRerollsChange = new Observable<number>();

  public incrementStageCompleted(): void {
    this.stagesCompletedCount++;
    this.onStageCompletedChange.notifyObservers(this.stagesCompletedCount);
  }

  public getStageCompletedCount(): number {
    return this.stagesCompletedCount;
  }

  public incrementKills(amount: number = 1): void {
    this.totalKill += amount;
    this.onTotalKillChange.notifyObservers(this.totalKill);
  }

  public addDamageTaken(amount: number): void {
    this.totalDamageTaken += amount;
    this.onTotalDamageTakenChange.notifyObservers(this.totalDamageTaken);
  }

  public addTimeSpent(seconds: number): void {
    this.timeSpentInStage += seconds;
    this.onTimeSpentInStageChange.notifyObservers(this.timeSpentInStage);
  }

  public addMoneySpentOnItems(amount: number): void {
    this.totalMoneySpentOnItems += amount;
    this.onTotalMoneySpentOnItemsChange.notifyObservers(this.totalMoneySpentOnItems);
  }

  public addMoneySpentOnRerolls(amount: number): void {
    this.totalMoneySpentOnRerolls += amount;
    this.onTotalMoneySpentOnRerollsChange.notifyObservers(this.totalMoneySpentOnRerolls);
  }

  public save(): string {
    return JSON.stringify({
      stagesCompletedCount: this.stagesCompletedCount,
      totalKill: this.totalKill,
      totalDamageTaken: this.totalDamageTaken,
      timeElapsed: this.timeSpentInStage,
      totalMoneySpentOnItems: this.totalMoneySpentOnItems,
      totalMoneySpentOnRerolls: this.totalMoneySpentOnRerolls,
    });
  }

  public restoreSave(data: string): void {
    const savedData = JSON.parse(data);
    this.stagesCompletedCount = savedData.stagesCompletedCount ?? 0;
    this.totalKill = savedData.totalKill ?? 0;
    this.totalDamageTaken = savedData.totalDamageTaken ?? 0;
    this.timeSpentInStage = savedData.timeElapsed ?? 0;
    this.totalMoneySpentOnItems = savedData.totalMoneySpentOnItems ?? 0;
    this.totalMoneySpentOnRerolls = savedData.totalMoneySpentOnRerolls ?? 0;
  }

  public resetSave(): void {
    this.stagesCompletedCount = 0;
    this.totalKill = 0;
    this.totalDamageTaken = 0;
    this.timeSpentInStage = 0;
    this.totalMoneySpentOnItems = 0;
    this.totalMoneySpentOnRerolls = 0;
  }
}
