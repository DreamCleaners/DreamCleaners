import { Quaternion, Scalar, UniversalCamera, Vector3 } from '@babylonjs/core';
import { Player } from './player';
import { InputState } from '../inputs/inputState';
import { SettingType } from '../settingType';

export class CameraManager {
  private camera!: UniversalCamera;
  private readonly FOV = 0.9;
  private readonly MAX_ANGULAR_SENSIBILITY = 5000;
  private readonly DEFAULT_SENSIVITY = 0.5;
  private sensivity = this.DEFAULT_SENSIVITY;

  // tilt
  private readonly MAX_TILT_ANGLE = 0.8; // degrees
  private readonly TILT_TRANSITION_SPEED = 6;

  constructor(private player: Player) {
    // We don't use the save system here because the camera settings are independent of the player's progression.
    this.sensivity = parseFloat(
      window.localStorage.getItem(SettingType.CAMERA_SENSIVITY) ??
        this.DEFAULT_SENSIVITY.toString(),
    );
    this.initCamera();
    this.setCameraSensivity(this.sensivity);
  }

  private initCamera(): void {
    this.camera = new UniversalCamera(
      'playerCamera',
      new Vector3(0, 1, 0),
      this.player.game.scene,
    );

    this.camera.parent = this.player.hitbox;
    this.camera.setTarget(new Vector3(0, 1, 1));
    this.camera.attachControl(
      this.player.game.scene.getEngine().getRenderingCanvas(),
      true,
    ); // Enable mouse control

    // Attach control binds the camera to mouse and keyboard inputs, we want to use only mouse inputs
    // So we remove all unwelcomed inputs
    this.camera.inputs.removeByType('FreeCameraKeyboardMoveInput');
    this.camera.inputs.removeByType('FreeCameraGamepadInput');
    this.camera.inputs.removeByType('FreeCameraTouchInput');

    // No deceleration
    this.camera.inertia = 0;

    // Allows no "near clipping" of meshes when close to the camera
    this.camera.minZ = 0.01;
    this.camera.fov = this.FOV;

    // we use quaternions to avoid gimbal lock when rotating the camera
    this.camera.rotationQuaternion = Quaternion.Identity();
  }

  public updateCamera(playerInputs: InputState): void {
    const deltaTime = this.player.game.getDeltaTime() / 1000;

    const maxTiltRad = (this.MAX_TILT_ANGLE * Math.PI) / 180;
    const newRotationZ = maxTiltRad * -playerInputs.directions.x;

    const currentCameraRotation = this.camera.rotationQuaternion.toEulerAngles();

    currentCameraRotation.z = Scalar.Lerp(
      currentCameraRotation.z,
      newRotationZ,
      this.TILT_TRANSITION_SPEED * deltaTime,
    );

    this.camera.rotationQuaternion = Quaternion.FromEulerAngles(
      currentCameraRotation.x,
      currentCameraRotation.y,
      currentCameraRotation.z,
    );
  }

  // Getters and setters

  public getRotationY(): number {
    if (!this.camera.rotationQuaternion) return 0;
    return this.camera.rotationQuaternion.toEulerAngles().y;
  }

  public setCameraHeight(height: number): void {
    this.camera.position.y = height;
  }

  public getCameraPositionY(): number {
    return this.camera.position.y;
  }

  public getCamera(): UniversalCamera {
    return this.camera;
  }

  public getCameraSensivity(): number {
    return this.sensivity;
  }

  public setCameraSensivity(sensivity: number): void {
    this.sensivity = sensivity;

    this.camera.angularSensibility =
      this.MAX_ANGULAR_SENSIBILITY + 1 - this.sensivity * this.MAX_ANGULAR_SENSIBILITY;

    window.localStorage.setItem(SettingType.CAMERA_SENSIVITY, this.sensivity.toString());
  }
}
