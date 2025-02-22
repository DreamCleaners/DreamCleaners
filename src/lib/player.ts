import { UniversalCamera, Vector3 } from '@babylonjs/core';
import { InputState } from './inputs/inputState';
import { Game } from './game';
import { Weapon } from './weapons/weapon';
import { WeaponRarity } from './weapons/weaponRarity';
import { InputAction } from './inputs/inputAction';

export class Player {
  public static readonly MAX_AMOUNT_WEAPONS = 2;

  private inputs: InputState;
  public camera!: UniversalCamera;
  private speed = 7;

  private weapons!: Array<Weapon>;
  public equippedWeapon!: Weapon;

  private weaponSwitchDelay = 500;
  private lastWeaponSwitch = 0;

  constructor(public game: Game) {
    this.inputs = game.inputManager.inputState;
    this.initPlayerCamera();
    this.weapons = new Array<Weapon>();

    const simpleGlock = new Weapon(this, 'glock', WeaponRarity.COMMON);
    this.weapons.push(simpleGlock);
    this.equippedWeapon = simpleGlock;

    const shotgun = new Weapon(this, 'shotgun', WeaponRarity.LEGENDARY);
    this.weapons.push(shotgun);
  }

  private initPlayerCamera(): void {
    this.camera = new UniversalCamera(
      'playerCamera',
      new Vector3(0, 2, -10),
      this.game.scene,
    );

    this.camera.setTarget(Vector3.Zero());
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

  public update(deltaTime: number): void {
    if (!this.game.isPointerLocked) return;
    this.movePlayer(deltaTime);

    if (this.inputs.actions.get(InputAction.SHOOT)) {
      this.equippedWeapon.handlePrimaryFire();
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

    //debug
    console.log("Equipped weapon ammo remaining:" + this.equippedWeapon.currentAmmoRemaining);
  }

  /**Moves the player based on InputState directions. Currently only moves the camera. */
  private movePlayer(deltaTime: number): void {
    const direction = new Vector3(this.inputs.directions.x, 0, this.inputs.directions.y);

    const directionX = direction.x * deltaTime * this.speed;
    const directionY = direction.z * deltaTime * this.speed;
    this.camera.position.x +=
      directionY * Math.sin(this.camera.rotation.y) +
      directionX * Math.cos(this.camera.rotation.y);
    this.camera.position.z +=
      directionY * Math.cos(this.camera.rotation.y) -
      directionX * Math.sin(this.camera.rotation.y);
  }

  public addWeaponToPlayer(weapon: Weapon): void {
    this.weapons.push(weapon);
  }

  public removeWeaponFromPlayer(index: number): void {
    this.weapons.splice(index, 1);
  }

  /** Called whenever the players changes weapon in-hand
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
