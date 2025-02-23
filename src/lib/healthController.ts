import { Observable } from '@babylonjs/core';

export class HealthController {
  private health: number;

  public onDeath: Observable<void> = new Observable();

  constructor(private maxHealth: number) {
    this.health = maxHealth;
  }

  public addHealth(value: number): void {
    this.health += value;
    if (this.health > this.maxHealth) {
      this.health = this.maxHealth;
    }
  }

  public removeHealth(value: number): void {
    this.health -= value;
    if (this.health <= 0) {
      this.onDeath.notifyObservers();
    }
  }

  public getHealth(): number {
    return this.health;
  }
}
