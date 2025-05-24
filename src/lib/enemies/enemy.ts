import {
  Color4,
  IAgentParameters,
  InstantiatedEntries,
  Mesh,
  Observable,
  ParticleSystem,
  PhysicsAggregate,
  Quaternion,
  Vector3,
  AnimationGroup,
  MeshBuilder,
  PhysicsShapeType,
} from '@babylonjs/core';
import { HealthController } from '../healthController';
import { AnimationController } from '../animations/animationController';
import { IDamageable } from '../damageable';
import { GameScene } from '../scenes/gameScene';
import { BulletEffectManager } from '../weapons/passives/bulletEffectManager';
import { EnemyType } from './enemyType';
import { EnemyState } from './enemyState';
import { EnemyData } from './enemyData';
import { EnemyAnimation } from './enemyAnimation';
import { GameEntityType } from '../gameEntityType';
import { MetadataFactory } from '../metadata/metadataFactory';
import { FireBall } from './fireBall';
import { ColliderMask } from '../colliderMask';

export class Enemy implements IDamageable {
  public mesh!: Mesh;
  private physicsAggregate!: PhysicsAggregate;

  private healthController: HealthController = new HealthController();
  private animationController: AnimationController = new AnimationController();
  public onDeathObservable!: Observable<void>;
  public bulletEffectManager = new BulletEffectManager(this);

  // crowd navigation
  private agentIndex: number = -1;
  private get agentParameters(): IAgentParameters {
    return {
      radius: this.enemyData.meshData.radius,
      height: this.enemyData.meshData.height,
      maxAcceleration: 1000,
      maxSpeed: this.speed,
      collisionQueryRange: 0.5,
      pathOptimizationRange: 0.5,
      separationWeight: 1,
    };
  }

  private target: Vector3 = Vector3.Zero();
  private initialized = false;
  private state = EnemyState.START_WALK;

  // stats
  private attackRange: number = 0;
  private attackSpeed: number = 0; // seconds between attacks
  private lastAttackTime: number = 0;
  private attackDamage: number = 0;
  public speed: number = 0;

  constructor(
    private gameScene: GameScene,
    difficultyFactor: number,
    private entries: InstantiatedEntries,
    position: Vector3,
    private enemyData: EnemyData,
    private enemyType: EnemyType,
  ) {
    this.onDeathObservable = this.healthController.onDeath;
    this.healthController.onDeath.add(this.onDeath.bind(this));
    this.initStats(difficultyFactor);
    this.target = this.gameScene.game.player.hitbox.position;
    this.init(position);
  }

  private initStats(difficultyFactor: number): void {
    this.healthController.init(this.enemyData.baseStats.health + 15 * difficultyFactor);
    this.attackRange = this.enemyData.baseStats.attackRange;
    this.attackSpeed = this.enemyData.baseStats.attackSpeed;
    this.attackDamage = this.enemyData.baseStats.attackDamage;
    this.speed = this.enemyData.baseStats.speed + 0.05 * (difficultyFactor - 1);
  }

  private async init(position: Vector3): Promise<void> {
    this.mesh = this.entries.rootNodes[0] as Mesh;

    const rootNode = this.mesh.getChildTransformNodes(true)[0];
    rootNode.scaling.scaleInPlace(this.enemyData.meshData.scale);

    const hitbox = MeshBuilder.CreateBox('hitbox', {
      height: this.enemyData.meshData.height,
      width: this.enemyData.meshData.radius * 2,
      depth: this.enemyData.meshData.radius * 2,
    });
    hitbox.name = GameEntityType.ENEMY;
    hitbox.metadata = MetadataFactory.createMetadataObject<IDamageable>(this, {
      isDamageable: true,
    });
    this.mesh.addChild(hitbox);
    hitbox.position.addInPlace(
      new Vector3(
        this.enemyData.meshData.hitboxOffset.x,
        this.enemyData.meshData.height / 2,
        this.enemyData.meshData.hitboxOffset.y,
      ),
    );
    hitbox.isVisible = false;

    // navigation
    this.agentIndex = this.gameScene.navigationManager.crowd.addAgent(
      position,
      this.agentParameters,
      this.mesh,
    );

    // physics
    this.physicsAggregate = new PhysicsAggregate(
      hitbox,
      PhysicsShapeType.BOX,
      {
        mass: 1,
      },
      this.gameScene.game.scene,
    );
    this.physicsAggregate.body.setMassProperties({ inertia: new Vector3(0, 0, 0) });

    // disablePreStep to false so we can rotate the mesh without affecting the physics body
    this.physicsAggregate.body.disablePreStep = false;
    this.physicsAggregate.shape.isTrigger = true;
    this.physicsAggregate.shape.filterMembershipMask = ColliderMask.ENEMY;

    this.setAnimations();

    this.initialized = true;
  }

  private setAnimations(): void {
    this.entries.animationGroups.forEach((animationGroup) => {
      if (
        animationGroup.name === this.enemyData.walkAnimation.name &&
        !this.animationController.hasAnimation(EnemyAnimation.WALK)
      ) {
        this.animationController.addAnimation(EnemyAnimation.WALK, animationGroup);
      }

      if (
        animationGroup.name === this.enemyData.attackAnimation.name &&
        !this.animationController.hasAnimation(EnemyAnimation.ATTACK)
      ) {
        this.animationController.addAnimation(EnemyAnimation.ATTACK, animationGroup);
      }

      if (
        animationGroup.name === this.enemyData.idleAnimation.name &&
        !this.animationController.hasAnimation(EnemyAnimation.IDLE)
      ) {
        this.animationController.addAnimation(EnemyAnimation.IDLE, animationGroup);
      }
    });
  }

  public update(): void {
    if (!this.initialized) return;

    this.animationController.update();
    this.bulletEffectManager.update();
  }

  public fixedUpdate(): void {
    if (
      !this.initialized ||
      this.state === EnemyState.DEAD ||
      this.state === EnemyState.ATTACK
    )
      return;

    this.lastAttackTime += this.gameScene.game.getFixedDeltaTime();

    if (this.isInAttackRange()) this.state = EnemyState.IN_ATTACK_RANGE;
    else if (this.state !== EnemyState.WALK) this.state = EnemyState.START_WALK;

    switch (this.state) {
      case EnemyState.START_WALK:
        this.playWalkAnimation();
        this.state = EnemyState.WALK;
        break;
      case EnemyState.WALK:
        this.walk();
        break;
      case EnemyState.IN_ATTACK_RANGE:
        this.checkForAttack();
        break;
      default:
        break;
    }
  }

  private walk(): void {
    this.gameScene.navigationManager.moveAgentTo(this.agentIndex, this.target);

    const direction = new Vector3(
      this.target.x - this.mesh.absolutePosition.x,
      0,
      this.target.z - this.mesh.absolutePosition.z,
    ).normalize();
    const rotationY: number = Math.atan2(direction.z, -direction.x) + Math.PI / 2;
    this.mesh.rotationQuaternion = Quaternion.FromEulerAngles(0, rotationY, 0);
  }

  private checkForAttack(): void {
    // make the enemy stop moving
    this.gameScene.navigationManager.moveAgentTo(this.agentIndex, this.mesh.position);

    if (this.lastAttackTime < this.attackSpeed * 1000) return;
    this.attack();
  }

  private attack(): void {
    this.state = EnemyState.ATTACK;
    this.lastAttackTime = 0;

    const animation = this.playAttackAnimation();
    animation.onAnimationGroupEndObservable.addOnce(() => {
      if (this.state === EnemyState.DEAD) return;

      this.gameScene.game.soundManager.playEnemyAttackSound(
        this.mesh.position,
        this.enemyType,
      );

      if (this.enemyData.isMelee) {
        this.applyDamageToPlayer();
      } else {
        this.createProjectile();
      }

      this.playIdleAnimation();
      this.state = EnemyState.IN_ATTACK_RANGE;
    });
  }

  private createProjectile(): void {
    new FireBall(
      this.gameScene.game,
      this,
      this.mesh.position
        .clone()
        .addInPlaceFromFloats(
          this.enemyData.meshData.hitboxOffset.x,
          this.enemyData.meshData.height * 0.5,
          this.enemyData.meshData.hitboxOffset.y,
        ),
      this.target.clone().addInPlaceFromFloats(0, 0.6, 0),
    );
  }

  public applyDamageToPlayer(): void {
    this.gameScene.game.player.takeDamage(this.attackDamage);
  }

  private playWalkAnimation(): void {
    const baseAnimationSpeedRatio = this.enemyData.walkAnimation.options.speedRatio ?? 1;

    this.animationController.startAnimation(EnemyAnimation.WALK, {
      loop: true,
      smoothTransition: true,
      speedRatio: baseAnimationSpeedRatio * (this.speed / this.enemyData.baseStats.speed),
      from: this.enemyData.walkAnimation.options.from,
      to: this.enemyData.walkAnimation.options.to,
    });
  }

  private playAttackAnimation(): AnimationGroup {
    const baseAnimationSpeedRatio =
      this.enemyData.attackAnimation.options.speedRatio ?? 1;

    const animation = this.animationController.startAnimation(EnemyAnimation.ATTACK, {
      loop: false,
      smoothTransition: true,
      speedRatio:
        baseAnimationSpeedRatio /
        (this.attackSpeed / this.enemyData.baseStats.attackSpeed),
      from: this.enemyData.attackAnimation.options.from,
      to: this.enemyData.attackAnimation.options.to,
    });

    return animation;
  }

  private playIdleAnimation(): void {
    const baseAnimationSpeedRatio = this.enemyData.idleAnimation.options.speedRatio ?? 1;

    this.animationController.startAnimation(EnemyAnimation.IDLE, {
      loop: true,
      smoothTransition: true,
      speedRatio: baseAnimationSpeedRatio,
      from: this.enemyData.idleAnimation.options.from,
      to: this.enemyData.idleAnimation.options.to,
    });
  }

  public takeDamage(damage: number): void {
    this.healthController.removeHealth(damage);
  }

  public dispose(): void {
    this.entries.dispose();
    this.physicsAggregate.dispose();
  }

  private onDeath(): void {
    this.state = EnemyState.DEAD;
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

  private isInAttackRange(): boolean {
    const distance = Vector3.Distance(
      this.mesh.position,
      this.gameScene.game.player.hitbox.position,
    );
    if (distance > this.attackRange) {
      return false;
    }
    return true;
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
      this.enemyData.meshData.hitboxOffset.x,
      this.enemyData.meshData.height * 0.8,
      this.enemyData.meshData.hitboxOffset.y,
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
