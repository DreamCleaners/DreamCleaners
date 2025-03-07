import {
  IPhysicsCollisionEvent,
  Mesh,
  MeshBuilder,
  Observable,
  PhysicsAggregate,
  PhysicsEventType,
  PhysicsShapeType,
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
import { CameraManager } from './cameraManager';

export class Player implements IDamageable {
  private inputs: InputState;
  public cameraManager!: CameraManager;
  public hitbox!: Mesh;
  private readonly SPEED = 7;
  public onDamageTakenObservable = new Observable<number>();

  // health
  private readonly healthController = new HealthController(1000);
  private timeSinceLastDamage = 0; // ms
  private regenDelay = 3; // seconds
  private regenAmount = 5;
  private regenInterval = 2; // seconds
  private lastRegenTick = 0; // ms

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

  // Crouching / sliding
  private isCrouching = false;
  public isSliding = false;
  private currentSlideVector: Vector3 = Vector3.Zero();
  // This vector is used to store the player's velocity before sliding as only this velocity will be used during the slide
  private currentSlidingSpeedFactor = 1.02;
  // By how much we multiply the player's velocity during the current slide
  private readonly INITIAL_SLIDING_SPEED_FACTOR = 1.02; // The initial factor

  private crouchStartTime: number | null = null;
  private crouchDuration = 350;
  // Duration of the crouch (lowering the camera and player's body)
  // animation in milliseconds
  private readonly ORIGINAL_PLAYER_HEIGHT = 2;
  private currentCrouchHeight = this.ORIGINAL_PLAYER_HEIGHT;

  constructor(public game: Game) {
    this.inputs = game.inputManager.inputState;
    this.healthController.onDeath.add(this.onGameOver.bind(this));

    this.initPhysicsAggregate();
    this.cameraManager = new CameraManager(this);

    this.weapons = new Array<Weapon>();

    /* const simpleGlock = new Weapon(this, 'glock', WeaponRarity.COMMON);
    this.weapons.push(simpleGlock);
    this.equippedWeapon = simpleGlock; */

    const ak = new Weapon(this, 'ak', WeaponRarity.COMMON);
    this.weapons.push(ak);
    this.equippedWeapon = ak;

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

  public update(): void {
    if (!this.game.isPointerLocked) return;

    if (this.inputs.actions.get(InputAction.SHOOT)) {
      this.equippedWeapon.handlePrimaryFire();
    } else {
      if (this.equippedWeapon.justShot) {
        // Meaning we just shot and released the button, we can now reset the justShot flag
        // To allow another shot
        this.equippedWeapon.justShot = false;
      }
    }

    if (this.inputs.actions.get(InputAction.PRESS_ONE)) {
      this.equipWeapon(0);
    }
    if (this.inputs.actions.get(InputAction.PRESS_TWO)) {
      this.equipWeapon(1);
    }
    if (this.inputs.actions.get(InputAction.RELOAD)) {
      this.equippedWeapon.reload();
    }

    if (this.inputs.actions.get(InputAction.CROUCH)) {
      if (!this.isCrouching) {
        this.crouch();
      }
    } else {
      if (this.isCrouching) {
        this.restoreHitboxHeight();
      }
    }

    this.cameraManager.updateCamera(this.velocity);
  }

  public fixedUpdate(): void {
    this.handleRegen();

    if (!this.game.isPointerLocked) return;

    this.updateVelocity();
  }

  public onGameOver(): void {
    console.log('GAME OVER: YOU ARE FIRED');
  }

  public takeDamage(damage: number): void {
    this.timeSinceLastDamage = 0;
    this.onDamageTakenObservable.notifyObservers(damage);
    this.healthController.removeHealth(damage);
    console.log(
      `Player took ${damage} damage, current health: ${this.healthController.getHealth()}`,
    );
  }

  private handleRegen(): void {
    this.timeSinceLastDamage += this.game.engine.getDeltaTime();

    if (this.timeSinceLastDamage > this.regenDelay * 1000) {
      this.lastRegenTick += this.game.engine.getDeltaTime();

      if (
        this.lastRegenTick > this.regenInterval * 1000 &&
        this.healthController.getHealth() < this.healthController.getMaxHealth()
      ) {
        this.healthController.addHealth(this.regenAmount);
        console.log(
          `Player regenerated ${this.regenAmount} health, current health: ${this.healthController.getHealth()}`,
        );
        this.lastRegenTick = 0;
      }
    }
  }

  public resetHealth(): void {
    this.healthController.addHealth(this.healthController.getMaxHealth());
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
    const rotationY = this.cameraManager.getRotationY();
    direction.x = directionZ * Math.sin(rotationY) + directionX * Math.cos(rotationY);
    direction.y = directionZ * Math.cos(rotationY) - directionX * Math.sin(rotationY);

    direction.normalize(); // Prevents faster diagonal movement

    // Slower movement when crouching
    if (this.isCrouching && !this.isSliding) {
      this.velocity.x = direction.x * (this.SPEED / 2);
      this.velocity.z = direction.y * (this.SPEED / 2);
    } else if (this.isCrouching && this.isSliding) {
      // Sliding movement
      this.velocity = this.currentSlideVector;
      // Overwrite the velocity with the one before sliding, the player is not able to change direction during a slide
      // Actually we make the slide slightly faster than the player's normal speed
      this.currentSlidingSpeedFactor = Math.max(
        0,
        this.currentSlidingSpeedFactor - 0.0005,
      );
      // We reduce this factor over time during slide to make the slide stop eventually
      this.velocity.x = this.velocity.x * this.currentSlidingSpeedFactor;
      this.velocity.z = this.velocity.z * this.currentSlidingSpeedFactor;
    } else {
      this.velocity.x = direction.x * this.SPEED;
      this.velocity.z = direction.y * this.SPEED;
    }

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
      this.velocity.y = 0;
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

  // Sliding related, might be better to put these in another class

  /** Crouching logic for the player, we initiate an animation for simply reducing the player's body
   * height, this will lower the camera as well and reduce the player's speed.
   */
  private crouch(): void {
    if (this.isCrouching) {
      console.log('Already crouching !');
      return;
    }

    if (this.isMoving() && this.isGrounded) {
      // We try to crouch while moving, we initiate a slide
      this.isSliding = true;
      this.currentSlidingSpeedFactor = this.INITIAL_SLIDING_SPEED_FACTOR;
      this.currentSlideVector = this.velocity;
    }

    this.isCrouching = true;
    this.crouchStartTime = performance.now();
    this.interpolateHitboxHeight(this.currentCrouchHeight, 1, this.crouchDuration);
  }

  /** Whether the player is in movement, used to detect sliding initiation */
  private isMoving(): boolean {
    return this.inputs.directions.x !== 0 || this.inputs.directions.y !== 0;
  }

  /** Restore player's body height at original value */
  private restoreHitboxHeight(): void {
    this.isCrouching = false;
    this.isSliding = false;
    this.crouchStartTime = null;
    this.interpolateHitboxHeight(
      this.currentCrouchHeight,
      this.ORIGINAL_PLAYER_HEIGHT,
      this.crouchDuration,
    );
  }

  /** Actual body's height modification over a duration to smooth the operation */
  private interpolateHitboxHeight(
    startHeight: number,
    targetHeight: number,
    duration: number,
  ): void {
    const startTime = this.crouchStartTime || performance.now();
    const initialCameraY = this.cameraManager.getCameraPositionY();

    const animate = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const newHeight = startHeight + (targetHeight - startHeight) * progress;

      this.hitbox.scaling.y = 1;
      this.hitbox.position.y = newHeight / 2;
      this.cameraManager.setCameraHeight(initialCameraY - (startHeight - newHeight) / 2);

      this.currentCrouchHeight = newHeight;
      // Store the current height, in case the player cancels the crouch then
      // instantly crouches again, we need to know the current height to interpolate from

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.crouchStartTime = null;
      }
    };

    requestAnimationFrame(animate);
  }
}
