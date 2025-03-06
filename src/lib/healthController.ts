import { Observable } from '@babylonjs/core';

export class HealthController {
  private health: number;

  public onDeath: Observable<void> = new Observable();

  constructor(public maxHealth: number = -1) {
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
      this.health = 0;
      this.onDeath.notifyObservers();
    }
  }

  public setHealth(value: number): void {
    this.health = value;
  }

  public getHealth(): number {
    return this.health;
  }

  public getMaxHealth(): number {
    return this.maxHealth;
  }
}
