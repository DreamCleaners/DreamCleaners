import {
  Mesh,
  MeshBuilder,
  Observable,
  PhysicsAggregate,
  PhysicsEngineV2,
  PhysicsRaycastResult,
  PhysicsShapeType,
  Quaternion,
  ShapeCastResult,
  Vector2,
  Vector3,
} from '@babylonjs/core';
import { InputState } from '../inputs/inputState';
import { Game } from '../game';
import { Weapon } from '../weapons/weapon';
import { WeaponRarity } from '../weapons/weaponRarity';
import { InputAction } from '../inputs/inputAction';
import { IDamageable } from '../damageable';
import { HealthController } from '../healthController';
import { GameEntityType } from '../gameEntityType';
import { PlayerUpgradeManager } from './playerUpgradeManager';
import { CameraManager } from '../cameraManager';
import { PlayerUpgradeType } from './playerUpgradeType';
import { InteractiveElement } from '../interactiveElements/interactiveElement';

export class Player implements IDamageable {
  private inputs: InputState;
  public cameraManager!: CameraManager;
  public hitbox!: Mesh;
  public playerUpgradeManager!: PlayerUpgradeManager;

  // observables
  public onDamageTakenObservable = new Observable<number>();
  public onWeaponChange = new Observable<Weapon>();

  // movement
  private movementSpeed = 0;
  private moveDirection: Vector2 = Vector2.Zero();

  // health
  public readonly healthController = new HealthController();
  private timeSinceLastDamage = 0; // ms
  private readonly REGEN_DELAY = 3; // seconds
  private readonly REGEN_AMOUNT = 5;
  private regenSpeed = 0; // seconds
  private lastRegenTick = 0; // ms
  private isRegenUnlocked = false;

  // physics
  public physicsEngine!: PhysicsEngineV2;
  private readonly PLAYER_GRAVITY = 0.3;
  private readonly MAX_FALL_SPEED = 10;
  private isGrounded = true;
  private velocity: Vector3 = Vector3.Zero();
  private physicsAggregate!: PhysicsAggregate;
  private surfaceNormal: Vector3 = Vector3.Zero(); // the normal of the surface the player is standing on
  private readonly MAX_SLOPE_ANGLE = 50; // degrees

  // jump
  private readonly JUMP_FORCE = 9;
  private lastJumpTime = 0;
  private readonly JUMP_COOLDOWN = 500; // ms

  // weapons
  private weapons!: Array<Weapon>;
  public equippedWeapon!: Weapon;
  private currentWeaponIndex = 0;
  private readonly WEAPON_SWITCH_DELAY = 500;
  private lastWeaponSwitch = 0;

  // Crouching / sliding
  private isCrouching = false;
  private wasCrouchingBeforeFalling = false; // used to prevent the player from gaining speed after falling while he was crouching
  public isSliding = false;
  private lastMoveDirection: Vector2 = Vector2.Zero(); // last direction before sliding
  // By how much we multiply the player's velocity during the current slide
  private currentSlidingSpeedFactor = 0;
  private readonly SLIDING_SPEED_REDUCTION = 0.012; // The factor by which we reduce the sliding speed over time
  private readonly INITIAL_SLIDING_SPEED_FACTOR = 1.6; // The initial factor

  private crouchStartTime: number = 0;
  // Duration of the crouch (lowering the camera and player's body)
  private readonly CROUCH_DURATION = 350; // ms
  private readonly ORIGINAL_PLAYER_HEIGHT = 2;
  private currentCrouchHeight = this.ORIGINAL_PLAYER_HEIGHT;

  // Interaction related
  private interactionRaycastResult: PhysicsRaycastResult = new PhysicsRaycastResult();

  constructor(public game: Game) {
    this.physicsEngine = game.scene.getPhysicsEngine() as PhysicsEngineV2;
    this.inputs = game.inputManager.inputState;
    this.healthController.onDeath.add(this.onGameOver.bind(this));
    this.initPhysicsAggregate();
    this.cameraManager = new CameraManager(this);

    // player upgrades
    this.playerUpgradeManager = new PlayerUpgradeManager(game);
    this.playerUpgradeManager.onPlayerUpgradeChange.add(
      this.onPlayerUpgradeChange.bind(this),
    );
    this.playerUpgradeManager.onPlayerUpgradeUnlock.add(
      this.onPlayerUpgradeUnlock.bind(this),
    );

    // weapons
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

  public start(): void {
    this.setPosition(new Vector3(0, 1, 0));
    this.setPlayerUpgrades();
  }

  public setPosition(position: Vector3): void {
    this.hitbox.position = position;
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
      PhysicsShapeType.CAPSULE,
      { mass: 1 },
      this.game.scene,
    );
    this.physicsAggregate.body.disablePreStep = false;
    this.physicsAggregate.body.setMassProperties({ inertia: new Vector3(0, 0, 0) });
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
      if (!this.isCrouching && this.isGrounded) {
        this.crouch();
      }
    } else {
      if (this.isCrouching) {
        this.restoreHitboxHeight();
      }
    }

    if (this.inputs.actions.get(InputAction.INTERACT)) {
      this.checkForInteractables();
    }

    this.cameraManager.updateCamera(this.velocity);
  }

  public fixedUpdate(): void {
    if (!this.game.isPointerLocked) return;

    if (this.isRegenUnlocked) this.handleRegen();
    this.updateVelocity();
    this.equippedWeapon.updatePosition(this.velocity);
  }

  public onGameOver(): void {
    console.log('GAME OVER: YOU ARE FIRED');
  }

  public takeDamage(damage: number): void {
    this.timeSinceLastDamage = 0;
    this.onDamageTakenObservable.notifyObservers(damage);
    this.healthController.removeHealth(damage);
  }

  // ----------------------- Health --------------------------
  // ---------------------------------------------------------

  private handleRegen(): void {
    this.timeSinceLastDamage += this.game.engine.getDeltaTime();

    if (this.timeSinceLastDamage > this.REGEN_DELAY * 1000) {
      this.lastRegenTick += this.game.engine.getDeltaTime();

      if (
        this.lastRegenTick > this.regenSpeed * 1000 &&
        this.healthController.getHealth() < this.healthController.getMaxHealth()
      ) {
        this.healthController.addHealth(this.REGEN_AMOUNT);
        this.lastRegenTick = 0;
      }
    }
  }

  public resetHealth(): void {
    this.healthController.addHealth(this.healthController.getMaxHealth());
  }

  // ------------------- Player Upgrades ---------------------
  // ---------------------------------------------------------

  private onPlayerUpgradeChange(upgradeType: PlayerUpgradeType): void {
    if (upgradeType === PlayerUpgradeType.MOVEMENT_SPEED) {
      this.movementSpeed = this.playerUpgradeManager.getCurrentUpgradeValue(
        PlayerUpgradeType.MOVEMENT_SPEED,
      );
    } else if (upgradeType === PlayerUpgradeType.MAX_HEALTH) {
      this.healthController.setMaxHealth(
        this.playerUpgradeManager.getCurrentUpgradeValue(PlayerUpgradeType.MAX_HEALTH),
      );
      this.healthController.addHealth(this.healthController.getMaxHealth());
    } else if (upgradeType === PlayerUpgradeType.REGEN_SPEED) {
      this.regenSpeed = this.playerUpgradeManager.getCurrentUpgradeValue(
        PlayerUpgradeType.REGEN_SPEED,
      );
    }
  }

  private onPlayerUpgradeUnlock(upgradeType: PlayerUpgradeType): void {
    if (upgradeType === PlayerUpgradeType.REGEN_SPEED) {
      this.isRegenUnlocked = true;
      this.regenSpeed = this.playerUpgradeManager.getCurrentUpgradeValue(
        PlayerUpgradeType.REGEN_SPEED,
      );
    }
  }

  private setPlayerUpgrades(): void {
    this.healthController.init(
      this.playerUpgradeManager.getCurrentUpgradeValue(PlayerUpgradeType.MAX_HEALTH),
    );

    this.movementSpeed = this.playerUpgradeManager.getCurrentUpgradeValue(
      PlayerUpgradeType.MOVEMENT_SPEED,
    );

    if (this.playerUpgradeManager.isUpgradeUnlocked(PlayerUpgradeType.REGEN_SPEED)) {
      this.isRegenUnlocked = true;
      this.regenSpeed = this.playerUpgradeManager.getCurrentUpgradeValue(
        PlayerUpgradeType.REGEN_SPEED,
      );
    }
  }

  // --------------------- Physics --------------------------
  // --------------------------------------------------------

  /**
   * Updates player's velocity based on inputs
   */
  private updateVelocity(): void {
    const directionX = this.inputs.directions.x;
    const directionZ = this.inputs.directions.y;

    this.moveDirection = Vector2.Zero();
    const rotationY = this.cameraManager.getRotationY();
    this.moveDirection.x =
      directionZ * Math.sin(rotationY) + directionX * Math.cos(rotationY);
    this.moveDirection.y =
      directionZ * Math.cos(rotationY) - directionX * Math.sin(rotationY);

    this.moveDirection.normalize(); // Prevents faster diagonal movement

    this.isGrounded = this.checkIsGrounded();

    // player is falling
    if (!this.isGrounded) {
      const speed = this.wasCrouchingBeforeFalling
        ? this.movementSpeed / 2
        : this.movementSpeed;

      this.velocity.x = this.moveDirection.x * speed;
      this.velocity.z = this.moveDirection.y * speed;

      // apply gravity
      if (this.velocity.y > -this.MAX_FALL_SPEED) {
        this.velocity.y -= this.PLAYER_GRAVITY;
      } else {
        this.velocity.y = -this.MAX_FALL_SPEED;
      }

      this.physicsAggregate.body.setLinearVelocity(this.velocity);
      return;
    }

    // jump
    const canJump = performance.now() - this.lastJumpTime > this.JUMP_COOLDOWN;
    if (this.inputs.actions.get(InputAction.JUMP) && canJump) {
      this.isGrounded = false;
      this.lastJumpTime = performance.now();

      this.velocity.x = this.moveDirection.x * this.movementSpeed;
      this.velocity.y = this.JUMP_FORCE;
      this.velocity.z = this.moveDirection.y * this.movementSpeed;

      this.physicsAggregate.body.setLinearVelocity(this.velocity);
      return;
    }

    // crouch
    if (this.isCrouching && !this.isSliding) {
      const slopDirection = this.getSlopeDirection(this.moveDirection);
      // apply slower movements when crouching
      this.velocity.x = slopDirection.x * (this.movementSpeed / 2);
      this.velocity.y = slopDirection.y * (this.movementSpeed / 2);
      this.velocity.z = slopDirection.z * (this.movementSpeed / 2);
    }
    // slide
    else if (this.isCrouching && this.isSliding) {
      // we use the last move direction because the player is not able to change direction during a slide
      const slopDirection = this.getSlopeDirection(this.lastMoveDirection);

      // we reduce this factor over time during slide to make the slide stop eventually
      this.currentSlidingSpeedFactor = Math.max(
        0,
        this.currentSlidingSpeedFactor - this.SLIDING_SPEED_REDUCTION,
      );

      let speedFactor = this.movementSpeed * this.currentSlidingSpeedFactor;

      // if the slide speed is less than the crouching speed or if the player is moving up a slope
      // we change the player's state to crouching
      if (
        this.movementSpeed * this.currentSlidingSpeedFactor < this.movementSpeed / 2 ||
        slopDirection.y > 0
      ) {
        this.isSliding = false;
        speedFactor = this.movementSpeed / 2;
      }

      this.velocity.x = slopDirection.x * speedFactor;
      this.velocity.y = slopDirection.y * speedFactor;
      this.velocity.z = slopDirection.z * speedFactor;
    }
    // move normally
    else {
      const slopDirection = this.getSlopeDirection(this.moveDirection);

      this.velocity.x = slopDirection.x * this.movementSpeed;
      this.velocity.y = slopDirection.y * this.movementSpeed;
      this.velocity.z = slopDirection.z * this.movementSpeed;

      this.wasCrouchingBeforeFalling = false;
    }

    this.physicsAggregate.body.setLinearVelocity(this.velocity);
  }

  public freezePlayer(): void {
    this.physicsAggregate.body.setLinearVelocity(Vector3.Zero());
  }

  private checkIsGrounded(): boolean {
    let isGrounded = false;

    const start = this.hitbox.position.clone();

    const end = start.clone();
    end.y -= 0.05;

    const shapeLocalResult = new ShapeCastResult();
    const hitWorldResult = new ShapeCastResult();

    // make a shape cast under the player to check if he is grounded
    this.game.physicsPlugin.shapeCast(
      {
        shape: this.physicsAggregate.shape,
        rotation: Quaternion.Identity(),
        startPosition: start,
        endPosition: end,
        shouldHitTriggers: false,
      },
      shapeLocalResult,
      hitWorldResult,
    );

    if (hitWorldResult.hasHit) {
      this.surfaceNormal = hitWorldResult.hitNormal;
      const surfaceAngle =
        Math.acos(Vector3.Dot(hitWorldResult.hitNormal, Vector3.Up())) * (180 / Math.PI);

      // if the angle is too steep, the player is not grounded
      if (surfaceAngle < this.MAX_SLOPE_ANGLE) {
        isGrounded = true;
      }
    }

    return isGrounded;
  }

  private projectOnNormal(vec: Vector3, normal: Vector3): Vector3 {
    const dot = Vector3.Dot(vec, normal);
    return vec.subtract(normal.scale(dot));
  }

  public getVelocity(): Vector3 {
    return this.velocity;
  }

  /**
   * Returns the direction of the player on the slope he is standing on
   *
   * The slope direction is normalized
   */
  private getSlopeDirection(direction: Vector2): Vector3 {
    const slopDirection = this.projectOnNormal(
      new Vector3(direction.x, 0, direction.y),
      this.surfaceNormal,
    );
    slopDirection.normalize();
    return slopDirection;
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
    if (index === this.currentWeaponIndex) return;

    // Only update the desired weapon index if the key was not pressed recently
    if (Date.now() - this.lastWeaponSwitch > this.WEAPON_SWITCH_DELAY) {
      this.lastWeaponSwitch = Date.now();
      return;
    }
    if (index >= this.weapons.length) {
      throw new Error('Trying to equip a weapon that does not exist');
    }

    this.currentWeaponIndex = index;
    this.equippedWeapon.hideInScene();
    this.equippedWeapon = this.weapons[this.currentWeaponIndex];
    this.onWeaponChange.notifyObservers(this.equippedWeapon);
    this.equippedWeapon.showInScene();
  }

  // ------------------ Crouch / Sliding ---------------------
  // ---------------------------------------------------------

  /**
   * Crouching logic for the player, we initiate an animation for simply reducing the player's body
   * height, this will lower the camera as well and reduce the player's speed.
   */
  private crouch(): void {
    if (this.isCrouching) {
      return;
    }

    if (this.isMoving() && this.isGrounded) {
      // We try to crouch while moving, we initiate a slide
      this.isSliding = true;
      this.currentSlidingSpeedFactor = this.INITIAL_SLIDING_SPEED_FACTOR;
      this.lastMoveDirection = this.moveDirection;
    }

    this.isCrouching = true;
    this.wasCrouchingBeforeFalling = true;
    this.crouchStartTime = performance.now();
    this.interpolateHitboxHeight(this.currentCrouchHeight, 1, this.CROUCH_DURATION);
  }

  /**
   * Whether the player is in movement, used to detect sliding initiation
   */
  private isMoving(): boolean {
    return this.inputs.directions.x !== 0 || this.inputs.directions.y !== 0;
  }

  /**
   * Restore player's body height at original value
   */
  private restoreHitboxHeight(): void {
    this.isCrouching = false;
    this.isSliding = false;
    this.crouchStartTime = performance.now();
    this.interpolateHitboxHeight(
      this.currentCrouchHeight,
      this.ORIGINAL_PLAYER_HEIGHT,
      this.CROUCH_DURATION,
    );
  }

  /**
   * Actual body's height modification over a duration to smooth the operation
   */
  private interpolateHitboxHeight(
    startHeight: number,
    targetHeight: number,
    duration: number,
  ): void {
    const startTime = this.crouchStartTime;
    const initialCameraY = this.cameraManager.getCameraPositionY();

    const animate = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const newHeight = startHeight + (targetHeight - startHeight) * progress;

      // WARNING: This is a temporary fix, the hitbox is not scaling properly
      // this.hitbox.scaling.y = 1;
      // this.hitbox.position.y = newHeight / 2;
      this.cameraManager.setCameraHeight(initialCameraY - (startHeight - newHeight) / 2);

      this.currentCrouchHeight = newHeight;
      // Store the current height, in case the player cancels the crouch then
      // instantly crouches again, we need to know the current height to interpolate from

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.crouchStartTime = 0;
      }
    };

    requestAnimationFrame(animate);
  }

  // -------------------- Interaction ------------------------
  // ---------------------------------------------------------

  /**
   * If the player tries to interact, we check if there is an interactive object in front of him
   * via a raycast, if there is, we call the interact method of the object
   */
  private checkForInteractables(): void {
    const start = this.cameraManager.getCamera().globalPosition.clone();
    const direction = this.cameraManager.getCamera().getForwardRay().direction.scale(0.5);

    start.addInPlace(direction);

    const end = start.add(direction.scale(3)); // For interaction range

    this.physicsEngine.raycastToRef(start, end, this.interactionRaycastResult);

    if (this.interactionRaycastResult.hasHit) {
      const metadata = this.interactionRaycastResult.body?.transformNode.metadata;
      if (metadata && metadata.isInteractive) {
        const interactiveEntity = this.interactionRaycastResult.body?.transformNode
          .metadata as InteractiveElement;
        interactiveEntity.interact();
      }
    }
  }
}
