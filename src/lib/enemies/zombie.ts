import { Quaternion, Vector3 } from '@babylonjs/core';
import { Game } from '../game';
import { IDamageable } from '../damageable';
import { Enemy } from './enemy';

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

export class Zombie extends Enemy implements IDamageable {
  public onDeathObservable = this.healthController.onDeath;

  constructor(game: Game, difficultyFactor: number) {
    super(game, 'zombie', difficultyFactor);

    this.deadState = ZombieState.DEAD;
    this.attackingState = ZombieState.ATTACK;
    this.state = ZombieState.START_WALK;
  }

  override initStats(difficultyFactor: number): void {
    this.healthController.setHealth(200 + 15 * difficultyFactor);
    this.SPEED = 1 * difficultyFactor;
    this.ATTACK_RANGE = 100;
  }

  override async initAt(position: Vector3): Promise<void> {
    super.initAt(position).then(() => {
      this.entries.animationGroups.forEach((animationGroup) => {
        if (animationGroup.name === 'Zombie|ZombieWalk') {
          this.animationController.addAnimation(ZombieAnimation.WALK, animationGroup);
        } else if (animationGroup.name === 'Zombie|ZombieBite') {
          this.animationController.addAnimation(ZombieAnimation.BITE, animationGroup);
        }
      });
      this.initialized = true;
    });
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
