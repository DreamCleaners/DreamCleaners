import { Observable } from '@babylonjs/core';
import { Game } from './game';

export class ScoreManager {
  private score: number = 0;

  public totalKill: number = 0;
  public totalKillScore: number = 0;

  public timeElapsed: number = 0; // in seconds
  public totalTimeBonus: number = 0;
  private timer: number = 0; // in seconds
  private timerInterval: number | undefined;

  public totalDamageTaken: number = 0;
  public totalDamageTakenMalus: number = 0;

  private readonly TIME_SCORE_MULTIPLIER = 10_000;
  private readonly KILL_SCORE_MULTIPLIER = 10;
  private readonly DAMAGE_TAKEN_MALUS_MULTIPLIER = 0.5;

  public onTimerChange: Observable<number> = new Observable();

  private isStageStarted: boolean = false;
  public onStateChange: Observable<boolean> = new Observable();

  constructor(game: Game) {
    game.uiManager.onPauseMenuChange.add(this.onPause.bind(this));
  }

  private onPause(isPaused: boolean): void {
    if (!this.isStageStarted) {
      return;
    }

    if (isPaused) {
      this.stopTimer();
    } else {
      this.startTimer();
    }
  }

  private startTimer(): void {
    this.timerInterval = window.setInterval(() => {
      this.timer++;
      this.onTimerChange.notifyObservers(this.timer);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  public startStage(): void {
    this.stopTimer();
    this.isStageStarted = true;
    this.onStateChange.notifyObservers(this.isStageStarted);
    this.timer = 0;
    this.startTimer();
  }

  /**
   * Set the final score for the stage.
   */
  public endStage(): void {
    this.isStageStarted = false;
    this.onStateChange.notifyObservers(this.isStageStarted);
    this.stopTimer();

    this.totalKillScore = this.totalKill * this.KILL_SCORE_MULTIPLIER;
    this.score += this.totalKillScore;

    // calculate the score based on the time elapsed
    // the faster the player completes the stage, the higher the score
    this.timeElapsed = this.timer;
    this.totalTimeBonus = Math.floor((1 / this.timer) * this.TIME_SCORE_MULTIPLIER);
    this.score += this.totalTimeBonus;

    // malus
    this.totalDamageTakenMalus =
      this.totalDamageTaken * this.DAMAGE_TAKEN_MALUS_MULTIPLIER;
    this.score = Math.max(this.score - this.totalDamageTakenMalus, 0);

    this.score = Math.floor(this.score);
  }

  public getScore(): number {
    return this.score;
  }

  public convertScoreToMoney(score: number): number {
    const moneyEarned = score; // 1:1 conversion for now
    return moneyEarned;
  }

  public onEnemyDeath(): void {
    this.totalKill++;
  }

  public onPlayerDamageTaken(damage: number): void {
    this.totalDamageTaken += damage;
  }

  /**
   * Reset the score for a new stage.
   */
  public reset(): void {
    this.score = 0;

    this.totalKill = 0;
    this.totalKillScore = 0;

    this.timeElapsed = 0;
    this.totalTimeBonus = 0;

    this.totalDamageTaken = 0;
    this.totalDamageTakenMalus = 0;
  }
}
