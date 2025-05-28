import { Observable } from '@babylonjs/core';
import { Game } from './game';

export class ScoreManager {
  private scoreFactor: number = 2.0; // Start with maximum multiplier

  public totalKill: number = 0;
  public killFactorBonus: number = 0;

  public timeElapsed: number = 0; // in seconds
  public timeFactorMalus: number = 0;
  private timer: number = 0; // in seconds
  private timerInterval: number | undefined;

  public totalDamageTaken: number = 0;
  public damageFactorMalus: number = 0;

  // Constants for score factor calculations
  private readonly MAX_FACTOR = 2.0;
  private readonly MIN_FACTOR = 1.0;
  private readonly MAX_DAMAGE_MALUS = 0.6;
  private readonly MAX_TIME_MALUS = 0.4;
  private readonly MAX_KILL_BONUS = 0.6;
  private readonly TIME_PENALTY_INTERVAL = 10;
  public onTimerChange: Observable<number> = new Observable();
  public onScoreFactorChange: Observable<number> = new Observable();

  private isStageStarted: boolean = false;
  public onStateChange: Observable<boolean> = new Observable();

  constructor(private game: Game) {
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
    this.scoreFactor = this.MAX_FACTOR; // Start with maximum multiplier
    this.startTimer();
  }

  /**
   * Calculate the final score factor for the stage.
   * Returns a factor between 1.0 and 2.0 that can be used to multiply rewards,
   * rounded to the first decimal place.
   */
  public endStage(): number {
    this.isStageStarted = false;
    this.onStateChange.notifyObservers(this.isStageStarted);
    this.stopTimer();

    this.game.runManager.addTimeSpent(this.timer);

    // Reset to maximum factor
    this.scoreFactor = this.MAX_FACTOR;

    // Calculate damage malus - MORE PUNITIVE
    this.damageFactorMalus = Math.min(
      (this.totalDamageTaken / 50) * 0.4, // Much more punitive damage calculation
      this.MAX_DAMAGE_MALUS,
    );
    this.scoreFactor -= this.damageFactorMalus;

    // Calculate time malus - MORE PUNITIVE
    this.timeElapsed = this.timer;
    const EARLIER_TIME_THRESHOLD = 80; // 1:20 minutes in seconds - even earlier penalty start

    if (this.timeElapsed > EARLIER_TIME_THRESHOLD) {
      const overtimeSeconds = this.timeElapsed - EARLIER_TIME_THRESHOLD;
      const timeIntervals = Math.floor(overtimeSeconds / this.TIME_PENALTY_INTERVAL);
      this.timeFactorMalus = Math.min(
        timeIntervals * 0.015, // Increased from 0.01 to 0.015
        this.MAX_TIME_MALUS,
      );
      this.scoreFactor -= this.timeFactorMalus;
    }

    // Calculate kill factor effect (unchanged)
    // - At 0 kills: -0.6 (penalty)
    // - At 30 kills: 0 (neutral)
    // - At 40+ kills: +0.6 (bonus)
    const NEUTRAL_KILL_THRESHOLD = 30;
    const MAX_KILL_THRESHOLD = 40;

    if (this.totalKill <= NEUTRAL_KILL_THRESHOLD) {
      // Below or at neutral point - penalty scales linearly from -0.6 to 0
      this.killFactorBonus =
        -this.MAX_KILL_BONUS * (1 - this.totalKill / NEUTRAL_KILL_THRESHOLD);
    } else if (this.totalKill <= MAX_KILL_THRESHOLD) {
      // Between neutral and max - bonus scales linearly from 0 to 0.6
      const bonusRatio =
        (this.totalKill - NEUTRAL_KILL_THRESHOLD) /
        (MAX_KILL_THRESHOLD - NEUTRAL_KILL_THRESHOLD);
      this.killFactorBonus = this.MAX_KILL_BONUS * bonusRatio;
    } else {
      // Above max threshold - maximum bonus
      this.killFactorBonus = this.MAX_KILL_BONUS;
    }

    this.scoreFactor += this.killFactorBonus;

    // Ensure factor stays within bounds
    this.scoreFactor = Math.max(
      Math.min(this.scoreFactor, this.MAX_FACTOR),
      this.MIN_FACTOR,
    );

    // Round to first decimal
    this.scoreFactor = Math.round(this.scoreFactor * 10) / 10;

    this.onScoreFactorChange.notifyObservers(this.scoreFactor);
    return this.scoreFactor;
  }

  public getScoreFactor(): number {
    return this.scoreFactor;
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
    this.scoreFactor = this.MAX_FACTOR;

    this.totalKill = 0;
    this.killFactorBonus = 0;

    this.timeElapsed = 0;
    this.timeFactorMalus = 0;
    this.timer = 0;

    this.totalDamageTaken = 0;
    this.damageFactorMalus = 0;

    this.onScoreFactorChange.notifyObservers(this.scoreFactor);
  }
}
