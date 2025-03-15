import { Observable } from '@babylonjs/core';

export class MoneyManager {
  private playerMoney = 0;
  public onPlayerMoneyChange = new Observable<number>();

  public convertScoreToMoney(score: number): void {
    this.addPlayerMoney(score);
  }

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
}
