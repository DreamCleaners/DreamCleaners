export class ScoreManager {
  private score: number = 0;
  private totalKillScore: number = 0;
  private totalTimeBonus: number = 0;
  private totalDamageTakenMalus: number = 0;

  private readonly TIME_SCORE_MULTIPLIER = 10_000;
  private readonly KILL_SCORE_MULTIPLIER = 10;
  private readonly DAMAGE_TAKEN_MALUS_MULTIPLIER = 0.5;

  private startTimestamp: number = Date.now();

  /**
   * Set the final score for the stage.
   */
  public endStage(): void {
    console.log(`=> Total kill score: +${this.totalKillScore}, Score: ${this.score}`);

    // calculate the score based on the time elapsed
    // the faster the player completes the stage, the higher the score
    const elapsedSeconds = (Date.now() - this.startTimestamp) / 1_000;
    this.totalTimeBonus = Math.floor((1 / elapsedSeconds) * this.TIME_SCORE_MULTIPLIER);
    this.score += this.totalTimeBonus;
    console.log(`=> Time bonus: +${this.totalTimeBonus}, Score: ${this.score}`);

    // malus
    this.score -= this.totalDamageTakenMalus;
    console.log(
      `=> Damage taken malus: -${this.totalDamageTakenMalus}, Score: ${this.score}`,
    );

    console.log(`=> Final score: ${this.score}`);
  }

  public getScore(): number {
    return this.score;
  }

  public getTimeBonus(): number {
    return this.totalTimeBonus;
  }

  public getKillScore(): number {
    return this.totalKillScore;
  }

  public getDamageTakenMalus(): number {
    return this.totalDamageTakenMalus;
  }

  public onEnemyDeath(): void {
    this.totalKillScore += this.KILL_SCORE_MULTIPLIER;
    this.score += this.KILL_SCORE_MULTIPLIER;
  }

  public onPlayerDamageTaken(damage: number): void {
    this.totalDamageTakenMalus += damage * this.DAMAGE_TAKEN_MALUS_MULTIPLIER;
  }

  /**
   * Reset the score for a new stage.
   */
  public reset(): void {
    this.score = 0;
    this.startTimestamp = Date.now();
    this.totalKillScore = 0;
    this.totalTimeBonus = 0;
    this.totalDamageTakenMalus = 0;
  }
}
