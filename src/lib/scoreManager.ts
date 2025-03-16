export class ScoreManager {
  private score: number = 0;

  public totalKill: number = 0;
  public totalKillScore: number = 0;

  public timeElapsed: number = 0; // in seconds
  public totalTimeBonus: number = 0;
  private startTimestamp: number = Date.now(); // in milliseconds

  public totalDamageTaken: number = 0;
  public totalDamageTakenMalus: number = 0;

  private readonly TIME_SCORE_MULTIPLIER = 10_000;
  private readonly KILL_SCORE_MULTIPLIER = 10;
  private readonly DAMAGE_TAKEN_MALUS_MULTIPLIER = 0.5;

  public startStage(): void {
    this.startTimestamp = Date.now();
  }

  /**
   * Set the final score for the stage.
   */
  public endStage(): void {
    this.totalKillScore = this.totalKill * this.KILL_SCORE_MULTIPLIER;
    this.score += this.totalKillScore;

    // calculate the score based on the time elapsed
    // the faster the player completes the stage, the higher the score
    this.timeElapsed = (Date.now() - this.startTimestamp) / 1_000;
    this.totalTimeBonus = Math.floor((1 / this.timeElapsed) * this.TIME_SCORE_MULTIPLIER);
    this.score += this.totalTimeBonus;

    // malus
    this.totalDamageTakenMalus =
      this.totalDamageTaken * this.DAMAGE_TAKEN_MALUS_MULTIPLIER;
    this.score = Math.max(this.score - this.totalDamageTakenMalus, 0);
  }

  public getScore(): number {
    return this.score;
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
