import {
  IBasePhysicsCollisionEvent,
  InstantiatedEntries,
  Mesh,
  MeshBuilder,
  Observer,
  PhysicsAggregate,
  PhysicsEventType,
  PhysicsShapeType,
  Quaternion,
  Vector3,
} from '@babylonjs/core';
import { Enemy } from './enemy';
import { GameEntityType } from '../gameEntityType';
import { MetadataFactory } from '../metadata/metadataFactory';
import { IDamageable } from '../damageable';
import { GameScene } from '../scenes/gameScene';

export enum ZombieState {
  START_WALK,
  WALK,
  ATTACK,
  DEAD,
}

enum ZombieAnimation {
  WALK = 'walk',
  BITE = 'bite',
}

export class Zombie extends Enemy {
  private onCollisionObserver!: Observer<IBasePhysicsCollisionEvent>;

  constructor(
    gameScene: GameScene,
    difficultyFactor: number,
    position: Vector3,
    entries: InstantiatedEntries,
  ) {
    super(gameScene, difficultyFactor, entries);

    this.deadState = ZombieState.DEAD;
    this.attackingState = ZombieState.ATTACK;
    this.state = ZombieState.START_WALK;

    this.init(position);
  }

  override initStats(difficultyFactor: number): void {
    this.healthController.init(200 + 15 * difficultyFactor);
    this.SPEED = 1 * difficultyFactor;
    this.ATTACK_RANGE = 100;
  }

  private async init(position: Vector3): Promise<void> {
    this.mesh = this.entries.rootNodes[0] as Mesh;

    const rootNode = this.mesh.getChildTransformNodes(true)[0];
    rootNode.scaling.scaleInPlace(0.3);

    // Use agentParameters from the parent class
    this.agentParameters.maxSpeed = this.SPEED;

    const hitbox = MeshBuilder.CreateCapsule('capsule', {
      height: this.agentParameters.height,
      radius: this.agentParameters.radius,
      tessellation: 16,
    });
    hitbox.name = GameEntityType.ENEMY;
    hitbox.metadata = MetadataFactory.createMetadataObject<IDamageable>(this, {
      isDamageable: true,
    });
    this.mesh.addChild(hitbox);
    hitbox.position.addInPlace(new Vector3(0.2, 1.25, 0.25));
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
      PhysicsShapeType.CAPSULE,
      {
        mass: 1,
      },
      this.gameScene.game.scene,
    );
    this.physicsAggregate.body.setMassProperties({ inertia: new Vector3(0, 0, 0) });

    // disablePreStep to false so we can rotate the mesh without affecting the physics body
    this.physicsAggregate.body.disablePreStep = false;
    this.physicsAggregate.shape.isTrigger = true;
    const observable = this.gameScene.game.physicsPlugin.onTriggerCollisionObservable;
    this.onCollisionObserver = observable.add(this.onCollision.bind(this));

    // animations
    this.entries.animationGroups.forEach((animationGroup) => {
      if (animationGroup.name === 'Zombie|ZombieWalk') {
        this.animationController.addAnimation(ZombieAnimation.WALK, animationGroup);
      } else if (animationGroup.name === 'Zombie|ZombieBite') {
        this.animationController.addAnimation(ZombieAnimation.BITE, animationGroup);
      }
    });

    this.initialized = true;
  }

  override update(): void {
    if (!this.initialized) return;
    super.update();

    this.animationController.update();
  }

  override fixedUpdate(): void {
    if (!this.initialized) return;

    switch (this.state) {
      case ZombieState.START_WALK:
        this.startWalk();
        break;
      case ZombieState.WALK:
        this.walk();
        break;
      case ZombieState.ATTACK:
        if (this.isAttacking) break;
        this.attack();
        break;
      case ZombieState.DEAD:
        return;
      default:
    }
  }

  override dispose(): void {
    super.dispose();
    this.onCollisionObserver.remove();
  }

  private startWalk(): void {
    this.animationController.startAnimation(ZombieAnimation.WALK, {
      loop: true,
      smoothTransition: true,
      transitionSpeed: 0.02,
      speedRatio: 1.5,
    });
    this.state = ZombieState.WALK;
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

  private attack(): void {
    this.isAttacking = true;

    this.gameScene.game.player.takeDamage(this.ATTACK_RANGE);

    const animation = this.animationController.startAnimation(ZombieAnimation.BITE, {
      loop: false,
      smoothTransition: true,
      transitionSpeed: 0.02,
      from: 50,
      to: 150,
      speedRatio: 1.25,
    });

    animation.onAnimationGroupEndObservable.add(() => {
      if (this.state === ZombieState.DEAD) return;
      this.state = ZombieState.START_WALK;
      this.isAttacking = false;
    });
  }

  private onCollision(collisionEvent: IBasePhysicsCollisionEvent): void {
    const collidedAgainst = collisionEvent.collidedAgainst;
    const collider = collisionEvent.collider;

    const isPlayerEnemyCollision =
      collidedAgainst.transformNode.name === GameEntityType.ENEMY &&
      collider.transformNode.name === GameEntityType.PLAYER;
    const isEnemyPlayerCollision =
      collidedAgainst.transformNode.name === GameEntityType.PLAYER &&
      collider.transformNode.name === GameEntityType.ENEMY;

    if (
      collisionEvent.type === PhysicsEventType.TRIGGER_ENTERED &&
      (isPlayerEnemyCollision || isEnemyPlayerCollision)
    ) {
      this.state = this.attackingState;
    }
  }
}
