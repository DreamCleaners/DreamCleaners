import {
  InstantiatedEntries,
  IPhysicsCollisionEvent,
  Mesh,
  Observable,
  PhysicsAggregate,
  PhysicsEventType,
  Vector3,
} from '@babylonjs/core';
import { Game } from '../game';
import { HealthController } from '../healthController';
import { AnimationController } from '../animations/animationController';
import { ZombieState } from './zombie';
import { GameEntityType } from '../gameEntityType';
import { IDamageable } from '../damageable';

export abstract class Enemy implements IDamageable {
  public mesh!: Mesh;
  protected healthController: HealthController = new HealthController();
  protected animationController: AnimationController = new AnimationController();
  protected state!: ZombieState | null;
  protected attackingState!: ZombieState | null;
  protected deadState!: ZombieState | null;
  protected isAttacking = false;

  protected physicsAggregate!: PhysicsAggregate;
  protected velocity: Vector3 = Vector3.Zero();
  protected target: Vector3 = Vector3.Zero();
  protected SPEED!: number;
  protected ATTACK_RANGE!: number;

  protected entries!: InstantiatedEntries;

  protected initialized = false;

  public onDeathObservable!: Observable<void>;

  constructor(
    protected game: Game,
    difficultyFactor: number,
    entries: InstantiatedEntries,
  ) {
    this.onDeathObservable = this.healthController.onDeath;
    this.healthController.onDeath.add(this.onDeath.bind(this));
    this.initStats(difficultyFactor);
    this.target = this.game.player.hitbox.position;
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

  protected onCollision(collisionEvent: IPhysicsCollisionEvent): void {
    const other = collisionEvent.collidedAgainst;
    if (
      (collisionEvent.type === PhysicsEventType.COLLISION_STARTED ||
        collisionEvent.type === PhysicsEventType.COLLISION_CONTINUED) &&
      other.transformNode.name === GameEntityType.PLAYER
    ) {
      this.state = this.attackingState;
    }
  }

  public onDeath(): void {
    this.state = this.deadState;
    this.dispose();
  }
}
