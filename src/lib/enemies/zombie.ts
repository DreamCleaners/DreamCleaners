import {
  InstantiatedEntries,
  Mesh,
  PhysicsAggregate,
  PhysicsShapeType,
  Quaternion,
  Vector3,
} from '@babylonjs/core';
import { Game } from '../game';
import { Enemy } from './enemy';
import { GameEntityType } from '../gameEntityType';
import { MetadataFactory } from '../metadata/metadataFactory';
import { IDamageable } from '../damageable';

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
  public onDeathObservable = this.healthController.onDeath;

  constructor(
    game: Game,
    difficultyFactor: number,
    position: Vector3,
    entries: InstantiatedEntries,
  ) {
    super(game, difficultyFactor, entries);

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
    const children = this.entries.rootNodes[0].getChildMeshes(false);
    this.mesh = children[0] as Mesh;
    this.mesh.name = GameEntityType.ENEMY;
    this.mesh.metadata = MetadataFactory.createMetadataObject<IDamageable>(this, {
      isDamageable: true,
    });
    this.mesh.position = position;

    this.mesh.scaling.scaleInPlace(0.35);
    // WARNING This is not a wanted solution, but the enemy keeps appearing at
    // the wrong absolute position. This is a temporary fix.
    this.mesh.setAbsolutePosition(position);

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

    this.physicsAggregate.body.setLinearVelocity(this.velocity);
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
}
