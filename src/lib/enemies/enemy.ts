import {
  InstantiatedEntries,
  IPhysicsCollisionEvent,
  Mesh,
  Observable,
  PhysicsAggregate,
  PhysicsEventType,
  PhysicsShapeType,
  Vector3,
} from '@babylonjs/core';
import { Game } from '../game';
import { HealthController } from '../healthController';
import { AnimationController } from '../animations/animationController';
import { ZombieState } from './zombie';
import { GameEntityType } from '../gameEntityType';
import { AssetType } from '../assetType';

export abstract class Enemy {
  public mesh!: Mesh;
  protected healthController!: HealthController;
  protected animationController!: AnimationController;
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

  protected assetName!: string;

  protected initialized = false;

  public onDeathObservable!: Observable<void>;

  constructor(
    protected game: Game,
    assetName: string,
    difficultyFactor: number,
  ) {
    this.assetName = assetName;
    this.animationController = new AnimationController();
    this.healthController = new HealthController();
    this.onDeathObservable = this.healthController.onDeath;
    this.healthController.onDeath.add(this.onDeath.bind(this));
    this.initStats(difficultyFactor);
    this.target = this.game.player.hitbox.position;
  }

  public async initAt(position: Vector3): Promise<void> {
    this.entries = await this.game.assetManager.loadAsset(
      this.assetName,
      AssetType.CHARACTER,
    );
    const children = this.entries.rootNodes[0].getChildMeshes(false);
    this.mesh = children[0] as Mesh;
    this.mesh.name = GameEntityType.ENEMY;
    this.mesh.metadata = this;
    this.mesh.position = position;

    this.mesh.scaling.scaleInPlace(0.35);
    // WARNING This is not a wanted solution, but the enemy keeps appearing at
    // the wrong absolute position. This is a temporary fix.
    this.mesh.setAbsolutePosition(position);
    this.mesh.metadata.isDamageable = true;

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

  public update(): void {}
  public fixedUpdate(): void {}

  public takeDamage(damage: number): void {
    this.healthController.removeHealth(damage);
  }

  protected abstract initStats(difficultyFactor: number): void;

  public dispose(): void {
    this.physicsAggregate.dispose();
    this.mesh.dispose();
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
