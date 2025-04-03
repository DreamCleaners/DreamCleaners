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
import { BulletEffectManager } from '../weapons/passives/bulletEffectManager';

export abstract class Enemy implements IDamageable {
  public mesh!: Mesh;
  protected healthController: HealthController = new HealthController();
  protected animationController: AnimationController = new AnimationController();
  protected state!: ZombieState | null;
  protected attackingState!: ZombieState | null;
  protected deadState!: ZombieState | null;
  protected isAttacking = false;
  protected agentIndex: number = -1;

  // Moved agentParameters here
  protected agentParameters = {
    radius: 0.5,
    height: 2.5,
    maxAcceleration: 8.0,
    maxSpeed: 1, // Default value, will be updated in initStats
    collisionQueryRange: 0.5,
    pathOptimizationRange: 0.5,
    separationWeight: 1.0,
  };

  protected physicsAggregate!: PhysicsAggregate;
  protected target: Vector3 = Vector3.Zero();
  public SPEED!: number;
  protected ATTACK_RANGE!: number;

  protected entries!: InstantiatedEntries;

  protected initialized = false;

  public onDeathObservable!: Observable<void>;

  // Bullet effects
  public bulletEffectManager!: BulletEffectManager;

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
    this.bulletEffectManager = new BulletEffectManager(this);
  }

  public update(): void {
    this.bulletEffectManager.update();
  }

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

  /** Updates the enemy's speed by updating the agent parameters */
  public updateSpeed(newSpeed: number): void {
    this.SPEED = newSpeed;
    this.agentParameters.maxSpeed = newSpeed;

    if (this.agentIndex !== -1) {
      this.gameScene.navigationManager.crowd.updateAgentParameters(
        this.agentIndex,
        this.agentParameters,
      );
    }
  }
}
