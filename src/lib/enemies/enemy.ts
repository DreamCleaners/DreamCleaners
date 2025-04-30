import {
  Color4,
  InstantiatedEntries,
  Mesh,
  Observable,
  ParticleSystem,
  PhysicsAggregate,
  Vector3,
} from '@babylonjs/core';
import { HealthController } from '../healthController';
import { AnimationController } from '../animations/animationController';
import { ZombieState } from './zombie';
import { IDamageable } from '../damageable';
import { GameScene } from '../scenes/gameScene';
import { BulletEffectManager } from '../weapons/passives/bulletEffectManager';
import { EnemyType } from './enemyType';

export abstract class Enemy implements IDamageable {
  public mesh!: Mesh;
  protected healthController: HealthController = new HealthController();
  protected animationController: AnimationController = new AnimationController();
  protected state!: ZombieState | null;
  protected attackingState!: ZombieState | null;
  protected deadState!: ZombieState | null;
  protected isAttacking = false;
  protected agentIndex: number = -1;
  protected enemyType!: EnemyType;

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
  public speed!: number;
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
    this.showBloodExplosionEffects();
    this.gameScene.game.soundManager.playEnemyDeath(this.mesh.position, this.enemyType);
    this.dispose();
  }

  /** Updates the enemy's speed by updating the agent parameters */
  public updateSpeed(newSpeed: number): void {
    this.speed = newSpeed;
    this.agentParameters.maxSpeed = newSpeed;

    if (this.agentIndex !== -1) {
      this.gameScene.navigationManager.crowd.updateAgentParameters(
        this.agentIndex,
        this.agentParameters,
      );
    }
  }

  private showBloodExplosionEffects(): void {
    const bloodExplosionParticleSystem = new ParticleSystem(
      'bloodExplosionParticles',
      60,
      this.gameScene.game.scene,
    );
    bloodExplosionParticleSystem.particleTexture =
      this.gameScene.game.assetManager.getTexture('circle');

    bloodExplosionParticleSystem.emitter = this.mesh.position.addInPlaceFromFloats(
      0,
      2,
      0,
    );
    bloodExplosionParticleSystem.minEmitBox = Vector3.Zero();
    bloodExplosionParticleSystem.maxEmitBox = Vector3.Zero();

    bloodExplosionParticleSystem.direction1 = new Vector3(1, 1, 1);
    bloodExplosionParticleSystem.direction2 = new Vector3(-1, -1, -1);

    bloodExplosionParticleSystem.emitRate = 1000;
    bloodExplosionParticleSystem.targetStopDuration = 0.1;
    bloodExplosionParticleSystem.updateSpeed = 0.01;

    bloodExplosionParticleSystem.minLifeTime = 0.1;
    bloodExplosionParticleSystem.maxLifeTime = 0.5;

    bloodExplosionParticleSystem.blendMode = ParticleSystem.BLENDMODE_MULTIPLY;

    bloodExplosionParticleSystem.color1 = new Color4(0.9, 0, 0, 1);
    bloodExplosionParticleSystem.color2 = new Color4(0.8, 0, 0, 1);
    bloodExplosionParticleSystem.colorDead = new Color4(0.1, 0, 0, 1);

    bloodExplosionParticleSystem.gravity = new Vector3(0, -10, 0);

    bloodExplosionParticleSystem.addSizeGradient(0, 0.5);
    bloodExplosionParticleSystem.addSizeGradient(1, 0);

    bloodExplosionParticleSystem.addVelocityGradient(0, 8);
    bloodExplosionParticleSystem.addVelocityGradient(1, 0);

    bloodExplosionParticleSystem.disposeOnStop = true;

    bloodExplosionParticleSystem.start();
  }
}
