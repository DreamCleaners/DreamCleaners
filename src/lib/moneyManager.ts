import { Observable } from '@babylonjs/core';
import { ISaveable } from './saveable';

export class MoneyManager implements ISaveable {
  private playerMoney = 0;
  public onPlayerMoneyChange = new Observable<number>();

  public getPlayerMoney(): number {
    return this.playerMoney;
  }

  public addPlayerMoney(value: number): void {
    this.playerMoney += value;
    this.onPlayerMoneyChange.notifyObservers(this.playerMoney);
  }

  public removePlayerMoney(value: number): void {
    this.playerMoney -= value;
    this.onPlayerMoneyChange.notifyObservers(this.playerMoney);
  }

  public save(): string {
    return JSON.stringify(this.playerMoney);
  }

  public restoreSave(data: string): void {
    this.playerMoney = JSON.parse(data);
  }

  public resetSave(): void {
    this.playerMoney = 0;
  }
}
