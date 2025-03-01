import {
  IPhysicsCollisionEvent,
  Mesh,
  PhysicsAggregate,
  PhysicsEventType,
  PhysicsShapeType,
  Quaternion,
  Vector3,
} from '@babylonjs/core';
import { Game } from './game';
import { AssetType } from './assetType';
import { HealthController } from './healthController';
import { IDamageable } from './damageable';
import { GameEntityType } from './gameEntityType';
import { AnimationController } from './animations/animationController';

enum ZombieState {
  START_WALK,
  WALK,
  ATTACK,
  DEAD,
}

enum ZombieAnimation {
  WALK = 'walk',
  BITE = 'bite',
}

export class Zombie implements IDamageable {
  public mesh!: Mesh;
  private healthController: HealthController = new HealthController(200);
  private animationController: AnimationController = new AnimationController();
  private state: ZombieState = ZombieState.START_WALK;
  private isAttacking = false;

  private physicsAggregate!: PhysicsAggregate;
  private velocity: Vector3 = Vector3.Zero();
  private target: Vector3 = Vector3.Zero();
  private SPEED = 0;
  private ATTACK_RANGE = 100;

  constructor(private game: Game) {}

  public async init(position: Vector3): Promise<void> {
    this.healthController.onDeath.add(this.onDeath.bind(this));
    this.target = this.game.player.camera.globalPosition;

    const entries = await this.game.assetManager.loadAsset('zombie', AssetType.CHARACTER);
    const children = entries.rootNodes[0].getChildMeshes(false);
    this.mesh = children[0] as Mesh;
    this.mesh.name = GameEntityType.ENEMY;
    this.mesh.metadata = this;
    this.mesh.scaling.scaleInPlace(0.35);
    this.mesh.position = position;

    entries.animationGroups.forEach((animationGroup) => {
      if (animationGroup.name === 'Zombie|ZombieWalk') {
        this.animationController.addAnimation(ZombieAnimation.WALK, animationGroup);
      } else if (animationGroup.name === 'Zombie|ZombieBite') {
        this.animationController.addAnimation(ZombieAnimation.BITE, animationGroup);
      }
    });

    this.physicsAggregate = new PhysicsAggregate(
      this.mesh,
      PhysicsShapeType.BOX,
      {
        mass: 1,
      },
      this.game.scene,
    );
    this.physicsAggregate.body.setMassProperties({ inertia: new Vector3(0, 0, 0) });

    // disablePreStep to false so we can rotate the mesh without affecting the physics body
    this.physicsAggregate.body.disablePreStep = false;
    this.physicsAggregate.body.setCollisionCallbackEnabled(true);
    const observable = this.physicsAggregate.body.getCollisionObservable();
    observable.add(this.onCollision.bind(this));
  }

  public update(): void {
    this.animationController.update();
  }

  public fixedUpdate(): void {
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

    this.physicsAggregate.body.setLinearVelocity(this.velocity);
  }

  public takeDamage(damage: number): void {
    this.healthController.removeHealth(damage);
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
    const direction = new Vector3(
      this.target.x - this.mesh.absolutePosition.x,
      0,
      this.target.z - this.mesh.absolutePosition.z,
    ).normalize();
    this.velocity = direction.scale(this.SPEED);

    const rotationY: number = Math.atan2(this.velocity.z, this.velocity.x) - Math.PI / 2;
    this.mesh.rotationQuaternion = Quaternion.FromEulerAngles(0, rotationY, 0);
  }

  private attack(): void {
    this.isAttacking = true;

    this.velocity = Vector3.Zero();
    this.game.player.takeDamage(this.ATTACK_RANGE);

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

  private onCollision(collisionEvent: IPhysicsCollisionEvent): void {
    const other = collisionEvent.collidedAgainst;
    if (
      (collisionEvent.type === PhysicsEventType.COLLISION_STARTED ||
        collisionEvent.type === PhysicsEventType.COLLISION_CONTINUED) &&
      other.transformNode.name === GameEntityType.PLAYER
    ) {
      this.state = ZombieState.ATTACK;
    }
  }

  public onDeath(): void {
    this.state = ZombieState.DEAD;
    this.physicsAggregate.dispose();
    this.mesh.dispose();
  }
}
