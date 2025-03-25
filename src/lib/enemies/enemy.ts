import {
  InstantiatedEntries,
  Mesh,
  Observable,
  PhysicsAggregate,
  Vector3,
} from '@babylonjs/core';
import { HealthController } from '../healthController';
import { AnimationController } from '../animations/animationController';
import { ZombieState } from './zombie';
import { IDamageable } from '../damageable';
import { GameScene } from '../scenes/gameScene';

export abstract class Enemy implements IDamageable {
  public mesh!: Mesh;
  protected healthController: HealthController = new HealthController();
  protected animationController: AnimationController = new AnimationController();
  protected state!: ZombieState | null;
  protected attackingState!: ZombieState | null;
  protected deadState!: ZombieState | null;
  protected isAttacking = false;
  protected agentIndex: number = -1;

  protected physicsAggregate!: PhysicsAggregate;
  protected target: Vector3 = Vector3.Zero();
  protected SPEED!: number;
  protected ATTACK_RANGE!: number;

  protected entries!: InstantiatedEntries;

  protected initialized = false;

  public onDeathObservable!: Observable<void>;

  constructor(
    protected gameScene: GameScene,
    difficultyFactor: number,
    entries: InstantiatedEntries,
  ) {
    this.onDeathObservable = this.healthController.onDeath;
    this.healthController.onDeath.add(this.onDeath.bind(this));
    this.initStats(difficultyFactor);
    this.target = this.gameScene.game.player.hitbox.position;
    this.entries = entries;
  }

  public update(): void {}
  public fixedUpdate(): void {}

  public takeDamage(damage: number): void {
    this.healthController.removeHealth(damage);
  }

  protected abstract initStats(difficultyFactor: number): void;

  public dispose(): void {
    this.entries.dispose();
    this.physicsAggregate.dispose();
  }

  public onDeath(): void {
    this.state = this.deadState;
    this.dispose();
  }
}
