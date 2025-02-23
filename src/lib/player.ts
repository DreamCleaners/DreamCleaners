import {
  IPhysicsCollisionEvent,
  Mesh,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsEventType,
  PhysicsShapeType,
  UniversalCamera,
  Vector2,
  Vector3,
} from '@babylonjs/core';
import { InputState } from './inputs/inputState';
import { Game } from './game';
import { Weapon } from './weapons/weapon';
import { WeaponRarity } from './weapons/weaponRarity';
import { InputAction } from './inputs/inputAction';
import { IDamageable } from './damageable';
import { HealthController } from './healthController';
import { GameEntityType } from './gameEntityType';

export class Player implements IDamageable {
  private inputs: InputState;
  public camera!: UniversalCamera;
  private hitbox!: Mesh;
  private readonly SPEED = 7;
  private readonly healthController = new HealthController(1000);

  // jump
  private readonly JUMP_FORCE = 6;
  private readonly PLAYER_GRAVITY = 0.17;
  private isGrounded = true;
  private canJump = true;

  // physics
  private velocity: Vector3 = Vector3.Zero();
  private physicsAggregate!: PhysicsAggregate;

  // weapons
  private weapons!: Array<Weapon>;
  public equippedWeapon!: Weapon;
  private weaponSwitchDelay = 500;
  private lastWeaponSwitch = 0;

  constructor(public game: Game) {
    this.inputs = game.inputManager.inputState;
    this.healthController.onDeath.add(this.onGameOver.bind(this));

    this.initPhysicsAggregate();
    this.initPlayerCamera();
    this.weapons = new Array<Weapon>();

    const simpleGlock = new Weapon(this, 'glock', WeaponRarity.COMMON);
    this.weapons.push(simpleGlock);
    this.equippedWeapon = simpleGlock;

    const shotgun = new Weapon(this, 'shotgun', WeaponRarity.LEGENDARY);
    this.weapons.push(shotgun);
  }

  private initPhysicsAggregate(): void {
    this.hitbox = MeshBuilder.CreateCapsule(
      GameEntityType.PLAYER,
      {
        height: 2,
        radius: 0.5,
      },
      this.game.scene,
    );
    this.hitbox.position.y = 1;
    this.hitbox.checkCollisions = false;
    this.hitbox.isVisible = false;

    this.physicsAggregate = new PhysicsAggregate(
      this.hitbox,
      PhysicsShapeType.BOX,
      { mass: 1 },
      this.game.scene,
    );
    this.physicsAggregate.body.setMassProperties({ inertia: new Vector3(0, 0, 0) });

    this.physicsAggregate.body.setCollisionCallbackEnabled(true);
    const observable = this.physicsAggregate.body.getCollisionObservable();
    observable.add(this.onCollision.bind(this));
  }

  private initPlayerCamera(): void {
    this.camera = new UniversalCamera(
      'playerCamera',
      new Vector3(0, 1, 0),
      this.game.scene,
    );

    this.camera.parent = this.hitbox;
    this.camera.setTarget(new Vector3(0, 1, 1));
    this.camera.attachControl(this.game.scene.getEngine().getRenderingCanvas(), true); // Enable mouse control

    // Attach control binds the camera to mouse and keyboard inputs, we want to use only mouse inputs
    // So we remove all unwelcomed inputs
    this.camera.inputs.removeByType('FreeCameraKeyboardMoveInput');
    this.camera.inputs.removeByType('FreeCameraGamepadInput');
    this.camera.inputs.removeByType('FreeCameraTouchInput');

    // No deceleration
    this.camera.inertia = 0;
    // Cam sensitivity
    this.camera.angularSensibility = 1000;
  }

  public update(): void {
    if (!this.game.isPointerLocked) return;
    this.updateVelocity();

    if (this.inputs.actions.get(InputAction.SHOOT)) {
      this.equippedWeapon.handlePrimaryFire();
    }

    if (this.inputs.actions.get(InputAction.PRESS_ONE)) {
      this.equipWeapon(0);
    }
    if (this.inputs.actions.get(InputAction.PRESS_TWO)) {
      this.equipWeapon(1);
    }
  }

  public onGameOver(): void {
    console.log('GAME OVER: YOU ARE FIRED');
  }

  public takeDamage(damage: number): void {
    this.healthController.removeHealth(damage);
    console.log(
      `Player took ${damage} damage, current health: ${this.healthController.getHealth()}`,
    );
  }

  // --------------------- Physics --------------------------
  // --------------------------------------------------------

  /**
   * Updates player's velocity based on inputs
   */
  private updateVelocity(): void {
    const directionX = this.inputs.directions.x;
    const directionZ = this.inputs.directions.y;

    const direction = Vector2.Zero();
    direction.x =
      directionZ * Math.sin(this.camera.rotation.y) +
      directionX * Math.cos(this.camera.rotation.y);
    direction.y =
      directionZ * Math.cos(this.camera.rotation.y) -
      directionX * Math.sin(this.camera.rotation.y);

    direction.normalize(); // Prevents faster diagonal movement
    this.velocity.x = direction.x * this.SPEED;
    this.velocity.z = direction.y * this.SPEED;

    if (this.isGrounded && this.inputs.actions.get(InputAction.JUMP) && this.canJump) {
      this.velocity.y = this.JUMP_FORCE;
      this.canJump = false;
      this.isGrounded = false;
    } else if (!this.isGrounded) {
      this.velocity.y -= this.PLAYER_GRAVITY;
    }

    this.physicsAggregate.body.setLinearVelocity(this.velocity);
  }

  private onCollision(collisionEvent: IPhysicsCollisionEvent): void {
    const other = collisionEvent.collidedAgainst;
    if (
      collisionEvent.type === PhysicsEventType.COLLISION_STARTED &&
      other.transformNode.name === GameEntityType.GROUND
    ) {
      this.isGrounded = true;
      this.canJump = true;
    }
  }

  // --------------------- Weapons ---------------------------
  // ---------------------------------------------------------

  public addWeaponToPlayer(weapon: Weapon): void {
    this.weapons.push(weapon);
  }

  public removeWeaponFromPlayer(index: number): void {
    this.weapons.splice(index, 1);
  }

  /**
   * Called whenever the players changes weapon in-hand
   * We ask the previous weapon to be hidden and the new one to be shown
   * And we replace the equippedWeapon field with the new weapon, to correctly handle shooting
   */
  public equipWeapon(index: number): void {
    // Only update the desired weapon index if the key was not pressed recently
    if (Date.now() - this.lastWeaponSwitch > this.weaponSwitchDelay) {
      this.lastWeaponSwitch = Date.now();
      return;
    }
    if (index >= this.weapons.length) {
      console.error('Trying to equip a weapon that does not exist');
      return;
    }

    this.equippedWeapon.hideInScene();
    this.equippedWeapon = this.weapons[index];
    this.equippedWeapon.showInScene();
  }
}
