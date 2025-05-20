import {
  Color3,
  Light,
  Mesh,
  MeshBuilder,
  Observable,
  PhysicsAggregate,
  PhysicsEngineV2,
  PhysicsRaycastResult,
  PhysicsShapeType,
  PointLight,
  Quaternion,
  ShapeCastResult,
  SpotLight,
  Vector2,
  Vector3,
} from '@babylonjs/core';
import { InputState } from '../inputs/inputState';
import { Game } from '../game';
import { Weapon } from '../weapons/weapon';
import { InputAction } from '../inputs/inputAction';
import { IDamageable } from '../damageable';
import { HealthController } from '../healthController';
import { GameEntityType } from '../gameEntityType';
import { CameraManager } from './cameraManager';
import { InteractiveElement } from '../interactiveElements/interactiveElement';
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { Control } from '@babylonjs/gui/2D/controls/control';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { PlayerInventory } from './playerInventory';
import { randomFloat } from '../utils/random';

export class Player implements IDamageable {
  private inputs: InputState;
  public cameraManager!: CameraManager;
  public hitbox!: Mesh;

  // firelight
  public fireLight!: Light;

  // flashlight
  private flashlight!: Light;
  private canToggleFlashlight = true;
  private readonly FLASHLIGHT_INTENSITY = 100;

  // gui
  private gui: AdvancedDynamicTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI');
  private container!: Control;
  private readonly INTERACTION_UI_OFFSET_Y = 50;
  private isInteractionUIVisible = false;

  // observables
  public onDamageTakenObservable = new Observable<number>();
  public onWeaponChange = new Observable<Weapon>();
  public onRegenSpeedPercentageChange = new Observable<number>();
  public onMaxHealthChange = new Observable<number>();
  public onSpeedPercentageChange = new Observable<number>();
  public onDodgeChancePercentageChange = new Observable<number>();
  public onSlideSpeedPercentageChange = new Observable<number>();

  // movement
  public moveSpeedPercentageIncrease = 0;
  private readonly BASE_MOVE_SPEED = 9;
  public movementSpeed = this.BASE_MOVE_SPEED;
  private moveDirection: Vector2 = Vector2.Zero();

  public dodgeChancePercentageIncrease = 0;
  private dodgeChance = 0;

  // health
  public readonly healthController = new HealthController();
  private timeSinceLastDamage = 0; // ms
  private readonly REGEN_DELAY = 3; // seconds
  private readonly REGEN_AMOUNT = 5;
  private readonly BASE_REGEN_SPEED = 0.5; // seconds
  public regenSpeedPercentageIncrease = 0;
  private regenSpeed = this.BASE_REGEN_SPEED; // seconds
  private lastRegenTick = 0; // ms
  private readonly BASE_HEALTH = 1000;
  public maxHealthIncrease = 0;

  // physics
  public physicsEngine!: PhysicsEngineV2;
  private readonly PLAYER_GRAVITY = 0.3;
  private readonly MAX_FALL_SPEED = 10;
  private isGrounded = true;
  private velocity: Vector3 = Vector3.Zero();
  private physicsAggregate!: PhysicsAggregate;
  private surfaceNormal: Vector3 = Vector3.Zero(); // the normal of the surface the player is standing on
  private readonly MAX_SLOPE_ANGLE = 50; // degrees
  private readonly MAX_SLOPE_CLIMB_ANGLE = 10; // degrees
  private surfaceAngle = 0; // degrees

  // jump
  private readonly JUMP_FORCE = 9;
  private lastJumpTime = 0;
  private readonly JUMP_COOLDOWN = 500; // ms

  // Inventory (weapons) related
  public inventory: PlayerInventory = new PlayerInventory(this);
  public equippedWeapon!: Weapon;
  public currentWeaponIndex = -1;
  private readonly WEAPON_SWITCH_DELAY = 500;
  private lastWeaponSwitch = 0;

  // Crouching / sliding
  private isCrouching = false;
  private wasCrouchingBeforeFalling = false; // used to prevent the player from gaining speed after falling while he was crouching
  public isSliding = false;
  private lastMoveDirection: Vector2 = Vector2.Zero(); // last direction before sliding
  public slideSpeedPercentageIncrease = 0;
  // By how much we multiply the player's velocity during the current slide
  private currentSlidingSpeedFactor = 0;
  // The final speed by which the player moves when sliding
  private currentSlidingSpeed = 0;
  private readonly SLIDING_SPEED_REDUCTION = 0.012; // The factor by which we reduce the sliding speed over time
  private readonly INITIAL_SLIDING_SPEED_FACTOR = 1.6; // The initial factor

  private crouchStartTime: number = 0;
  // Duration of the crouch (lowering the camera and player's body)
  private readonly CROUCH_DURATION = 350; // ms
  private readonly ORIGINAL_PLAYER_HEIGHT = 2;
  private currentCrouchHeight = this.ORIGINAL_PLAYER_HEIGHT;

  // Interaction
  private interactionRaycastResult: PhysicsRaycastResult = new PhysicsRaycastResult();
  private readonly INTERACTION_RANGE = 3;
  private interactiveObject: InteractiveElement | null = null;
  private canInteract = true;

  constructor(public game: Game) {
    this.physicsEngine = game.scene.getPhysicsEngine() as PhysicsEngineV2;
    this.inputs = game.inputManager.inputState;

    this.healthController.onDeath.add(this.onGameOver.bind(this));
    this.healthController.init(this.BASE_HEALTH);

    this.initPhysicsAggregate();
    this.cameraManager = new CameraManager(this);
    this.initFlashlight();
    this.initFireLight();

    this.initInteractionUI();
  }

  public async start(): Promise<void> {
    this.resetPlayerStatistics();

    this.setPosition(new Vector3(0, 1, 0));

    const weapons = this.inventory.getWeapons();

    // We need to initialize all meshes of the weapons before we can equip one, and thus
    // start the player
    await Promise.all(weapons.map((weapon) => weapon.init()));
    if (weapons.length > 0) {
      this.equipWeapon(0, true);
    }

    const playerPassives = this.inventory.getPlayerPassives();
    playerPassives.forEach((passive) => {
      passive.apply();
    });
  }

  public resetPlayerStatistics(): void {
    this.healthController.setMaxHealth(this.BASE_HEALTH);
    this.healthController.addHealth(this.BASE_HEALTH);

    this.moveSpeedPercentageIncrease = 0;
    this.movementSpeed = this.BASE_MOVE_SPEED;

    this.regenSpeedPercentageIncrease = 0;
    this.regenSpeed = this.BASE_REGEN_SPEED;

    this.dodgeChancePercentageIncrease = 0;
    this.dodgeChance = 0;

    this.slideSpeedPercentageIncrease = 0;
    this.currentSlidingSpeedFactor = 0;
  }

  public setPosition(position: Vector3): void {
    this.hitbox.position = position;
  }

  public getPosition(): Vector3 {
    return this.hitbox.position;
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

  private initFlashlight(): void {
    this.flashlight = new SpotLight(
      'flashlight',
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 1),
      Math.PI / 4,
      100,
      this.game.scene,
    );
    this.flashlight.intensity = this.FLASHLIGHT_INTENSITY;
    this.flashlight.parent = this.cameraManager.getCamera();
    this.flashlight.diffuse = new Color3(1, 0.7, 0);
    this.flashlight.specular = new Color3(1, 0.7, 0);
  }

  private initFireLight(): void {
    this.fireLight = new PointLight('fireLight', Vector3.Zero(), this.game.scene);
    this.fireLight.diffuse = new Color3(1, 0.92, 0);
    this.fireLight.specular = new Color3(1, 0.92, 0);
    this.fireLight.intensity = 0;
  }

  public update(): void {
    if (!this.game.isPointerLocked) return;

    // weapons
    if (this.equippedWeapon !== undefined) {
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
        this.equippedWeapon.initReload();
      }

      this.equippedWeapon.update();
    }

    // crouch / slide
    if (this.inputs.actions.get(InputAction.CROUCH)) {
      if (!this.isCrouching && this.isGrounded) {
        this.crouch();
      }
    } else {
      if (this.isCrouching) {
        this.restoreHitboxHeight();
      }
    }

    // interaction
    if (this.interactiveObject !== null) {
      this.displayInteractionUI(this.interactiveObject);

      if (this.inputs.actions.get(InputAction.INTERACT) && this.canInteract) {
        this.canInteract = false;
        this.interactiveObject.interact();
      }
    } else {
      this.hideInteractionUI();
    }

    if (!this.inputs.actions.get(InputAction.INTERACT)) {
      this.canInteract = true;
    }

    // flashlight
    if (this.inputs.actions.get(InputAction.FLASHLIGHT) && this.canToggleFlashlight) {
      this.canToggleFlashlight = false;
      this.toggleFlashlight();
    }

    if (!this.canToggleFlashlight && !this.inputs.actions.get(InputAction.FLASHLIGHT)) {
      this.canToggleFlashlight = true;
    }

    this.cameraManager.updateCamera(this.inputs);
  }

  public fixedUpdate(): void {
    if (!this.game.isPointerLocked) return;

    this.checkForInteractables();

    this.handleRegen();

    this.updateVelocity();

    if (this.equippedWeapon !== undefined) {
      this.equippedWeapon.fixedUpdate();
      this.equippedWeapon.updatePosition(this.velocity);
    }
  }

  public onGameOver(): void {
    this.game.soundManager.playPlayerDeath();
    this.game.gameOver();
  }

  public takeDamage(damage: number): void {
    const isDodged = randomFloat(0, 1) < this.dodgeChance;
    if (isDodged) return;

    this.timeSinceLastDamage = 0;
    this.onDamageTakenObservable.notifyObservers(damage);
    this.healthController.removeHealth(damage);
    this.game.soundManager.playPlayerTakesDamage();
  }

  public addSpeedPercentage(percentage: number): void {
    this.moveSpeedPercentageIncrease += percentage;
    this.movementSpeed = this.BASE_MOVE_SPEED * (1 + this.moveSpeedPercentageIncrease);
    this.onSpeedPercentageChange.notifyObservers(this.moveSpeedPercentageIncrease);
  }

  public addDodgeChancePercentage(percentage: number): void {
    this.dodgeChancePercentageIncrease += percentage;
    this.dodgeChance = this.dodgeChancePercentageIncrease;
    this.onDodgeChancePercentageChange.notifyObservers(
      this.dodgeChancePercentageIncrease,
    );
  }

  public toggleFlashlight(): void {
    if (this.flashlight.intensity === 0) {
      this.flashlight.intensity = this.FLASHLIGHT_INTENSITY;
      this.game.soundManager.playFlashlightSound(true);
    } else {
      this.flashlight.intensity = 0;
      this.game.soundManager.playFlashlightSound(false);
    }
  }

  // ----------------------- Health --------------------------
  // ---------------------------------------------------------

  private handleRegen(): void {
    this.timeSinceLastDamage += this.game.getFixedDeltaTime();

    if (this.timeSinceLastDamage > this.REGEN_DELAY * 1000) {
      this.lastRegenTick += this.game.getFixedDeltaTime();

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

  public addRegenSpeedPercentage(percentage: number): void {
    this.regenSpeedPercentageIncrease += percentage;
    this.regenSpeed = this.BASE_REGEN_SPEED * (1 + this.regenSpeedPercentageIncrease);
    this.onRegenSpeedPercentageChange.notifyObservers(this.regenSpeedPercentageIncrease);
  }

  public addMaxHealth(percentage: number): void {
    this.maxHealthIncrease += percentage;
    this.healthController.setMaxHealth(this.BASE_HEALTH + this.maxHealthIncrease);
    this.healthController.addHealth(this.healthController.getMaxHealth());
    this.onMaxHealthChange.notifyObservers(this.maxHealthIncrease);
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

    if (this.isGrounded && !this.isSliding) {
      // Reset the sliding speed var if the player is grounded
      this.currentSlidingSpeed = 0;
    }

    // player is falling
    if (!this.isGrounded) {
      if (this.isSliding) {
        // We cancel the slide mid-air as we don't allow sliding in the air
        this.isSliding = false;
      }

      let speed = 0;
      speed = Math.max(this.movementSpeed, this.currentSlidingSpeed);
      speed = this.wasCrouchingBeforeFalling ? speed / 2 : speed;

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

      const jumpingSpeed = Math.max(this.movementSpeed, this.currentSlidingSpeed);

      this.velocity.x = this.moveDirection.x * jumpingSpeed;
      this.velocity.y = this.JUMP_FORCE;
      this.velocity.z = this.moveDirection.y * jumpingSpeed;

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

      this.currentSlidingSpeed = this.movementSpeed * this.currentSlidingSpeedFactor;

      // if the slide speed is less than the crouching speed or if the player is moving up a slope
      // we change the player's state to crouching
      if (
        this.currentSlidingSpeed < this.movementSpeed / 2 ||
        (slopDirection.y > 0 && this.surfaceAngle > this.MAX_SLOPE_CLIMB_ANGLE)
      ) {
        this.isSliding = false;
        this.currentSlidingSpeed = this.movementSpeed / 2; // Reset sliding speed
      }

      this.velocity.x = slopDirection.x * this.currentSlidingSpeed;
      this.velocity.y = slopDirection.y * this.currentSlidingSpeed;
      this.velocity.z = slopDirection.z * this.currentSlidingSpeed;
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
      this.surfaceAngle =
        Math.acos(Vector3.Dot(hitWorldResult.hitNormal, Vector3.Up())) * (180 / Math.PI);

      // if the angle is too steep, the player is not grounded
      if (this.surfaceAngle < this.MAX_SLOPE_ANGLE) {
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

  public replaceWeaponAtIndex(index: number, weapon: Weapon): void {
    this.inventory.replaceWeaponInInventory(weapon, index);
    if (this.currentWeaponIndex === index) {
      console.log('Replacing a weapon that is currently equipped');
      this.equipWeapon(index, true);
    }
  }

  /**
   * Called whenever the players changes weapon in-hand
   * We ask the previous weapon to be hidden and the new one to be shown
   * And we replace the equippedWeapon field with the new weapon, to correctly handle shooting
   */
  public equipWeapon(index: number, forceActualisation: boolean = false): void {
    if (index === this.currentWeaponIndex && !forceActualisation) return;

    if (index >= this.inventory.getAmountOfWeapons()) {
      console.log('Tried to equip weapon ', index, ' but there is no weapon in here');
      return;
    }

    // Only update the desired weapon index if the key was not pressed recently
    if (
      Date.now() - this.lastWeaponSwitch > this.WEAPON_SWITCH_DELAY &&
      !forceActualisation
    ) {
      this.lastWeaponSwitch = Date.now();
      return;
    }

    this.currentWeaponIndex = index;
    if (this.equippedWeapon != undefined) {
      this.equippedWeapon.hideInScene();
    }
    this.equippedWeapon = this.inventory.getWeapons()[this.currentWeaponIndex];
    this.onWeaponChange.notifyObservers(this.equippedWeapon);
    this.equippedWeapon.showInScene();
  }

  public getInventory(): PlayerInventory {
    return this.inventory;
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
      this.currentSlidingSpeedFactor =
        this.INITIAL_SLIDING_SPEED_FACTOR * (1 + this.slideSpeedPercentageIncrease);
      this.lastMoveDirection = this.moveDirection;
    } else {
      // The player was not crouching but sliding
      this.wasCrouchingBeforeFalling = true;
    }

    this.isCrouching = true;
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

  public addSlideSpeedPercentage(percentage: number): void {
    this.slideSpeedPercentageIncrease += percentage;
    this.onSlideSpeedPercentageChange.notifyObservers(this.slideSpeedPercentageIncrease);
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
    start.addInPlace(direction);

    const end = start.add(direction.scale(this.INTERACTION_RANGE));

    this.physicsEngine.raycastToRef(start, end, this.interactionRaycastResult);

    if (this.interactionRaycastResult.hasHit) {
      const metadata = this.interactionRaycastResult.body?.transformNode.metadata;
      if (metadata && metadata.isInteractive) {
        this.interactiveObject = metadata.object as InteractiveElement;
        return;
      }
    }

    this.interactiveObject = null;
  }

  private initInteractionUI(): void {
    const rect = new Rectangle();
    rect.width = '50px';
    rect.height = '50px';
    rect.cornerRadius = 10;
    rect.color = 'white';
    rect.thickness = 4;
    rect.background = 'black';
    this.container = rect;

    const text = new TextBlock();
    text.text = 'E';
    text.color = 'white';
    text.fontSize = 28;
    rect.addControl(text);
  }

  private displayInteractionUI(interactiveObject: InteractiveElement): void {
    if (this.isInteractionUIVisible) return;

    this.isInteractionUIVisible = true;
    this.gui.addControl(this.container);
    this.container.linkWithMesh(interactiveObject.mesh.getChildMeshes()[0] as Mesh);
    this.container.linkOffsetY = -this.INTERACTION_UI_OFFSET_Y;
  }

  private hideInteractionUI(): void {
    this.isInteractionUIVisible = false;
    this.gui.removeControl(this.container);
  }

  public getWeapons(): Array<Weapon> {
    return this.inventory.getWeapons();
  }
}
