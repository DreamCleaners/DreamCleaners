import { Observable } from '@babylonjs/core';

export class HealthController {
  private maxHealth: number = 0;
  private health: number = 0;

  public onDeath: Observable<void> = new Observable();
  public onHealthChange: Observable<number> = new Observable();
  public onMaxHealthChange: Observable<number> = new Observable();

  public init(maxHealth: number): void {
    this.maxHealth = maxHealth;
    this.health = maxHealth;
  }

  public addHealth(value: number): void {
    this.health += value;
    if (this.health > this.maxHealth) {
      this.health = this.maxHealth;
    }
    this.onHealthChange.notifyObservers(this.health);
  }

  public removeHealth(value: number): void {
    this.health -= value;
    if (this.health <= 0) {
      this.health = 0;
      this.onDeath.notifyObservers();
    }
    this.onHealthChange.notifyObservers(this.health);
  }

  public getMaxHealth(): number {
    return this.maxHealth;
  }

  public setMaxHealth(value: number): void {
    this.maxHealth = value;
    this.onMaxHealthChange.notifyObservers(this.maxHealth);
  }

  public getHealth(): number {
    return this.health;
  }
}
