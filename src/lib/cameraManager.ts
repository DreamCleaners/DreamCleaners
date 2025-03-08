import { Camera, UniversalCamera, Vector3 } from '@babylonjs/core';
import { Player } from './player';

export class CameraManager {
  private camera!: UniversalCamera;
  private isCameraInclining: boolean = false; // Add a flag to track if the animation is running
  private WALK_CAMERA_ANIMATION_AMPLITUDE = 0.8;
  private WALK_CAMERA_ANIMATION_SPEED = 0.003;

  private FOV_ANIMATION_SPEED = 0.05;
  private MAX_FOV = 1.4;
  private NORMAL_FOV = 0.8;

  private readonly VELOCITY_IMPACT_ON_ANIMATION_SPEED = 0.1;

  constructor(private player: Player) {
    this.initCamera(player);
  }

  private initCamera(player: Player): void {
    this.camera = new UniversalCamera(
      'playerCamera',
      new Vector3(0, 1, 0),
      player.game.scene,
    );

    this.camera.parent = player.hitbox;
    this.camera.setTarget(new Vector3(0, 1, 1));
    this.camera.attachControl(player.game.scene.getEngine().getRenderingCanvas(), true); // Enable mouse control

    // Attach control binds the camera to mouse and keyboard inputs, we want to use only mouse inputs
    // So we remove all unwelcomed inputs
    this.camera.inputs.removeByType('FreeCameraKeyboardMoveInput');
    this.camera.inputs.removeByType('FreeCameraGamepadInput');
    this.camera.inputs.removeByType('FreeCameraTouchInput');

    // No deceleration
    this.camera.inertia = 0;
    // Cam sensitivity
    this.camera.angularSensibility = 1000;
    // Allows no "near clipping" of meshes when close to the camera
    this.camera.minZ = 0.01;
    this.camera.fov = this.NORMAL_FOV;
  }

  public updateCamera(playerVelocity: Vector3): void {
    // Based on the player's velocity, we are going to move the camera around a bit to give a sense of speed

    if (playerVelocity.length() > 0) {
      // Player is moving
      if (!this.isCameraInclining) {
        this.animateCameraInclinationPlayerWalking(playerVelocity);
      }
      this.animateFOV(playerVelocity.length());
    } else {
      // Player stopped moving
      this.stopInclinationAnimation();
      this.resetFOV();
    }
    if (this.player.isSliding) {
      this.stopInclinationAnimation();
      this.resetFOV();
    }
  }

  // ----------------------------------
  // INCLINATION RELATED
  // ----------------------------------

  /** Continuously inclines the camera to give a sense of speed */
  private animateCameraInclinationPlayerWalking(velocity : Vector3): void {
    const amplitude = this.WALK_CAMERA_ANIMATION_AMPLITUDE; 
    // The camera inclination
    const frequency = this.WALK_CAMERA_ANIMATION_SPEED * 
      (this.VELOCITY_IMPACT_ON_ANIMATION_SPEED * velocity.length()); 
    // The speed of the animation, depends on the player's velocity
    const initialRotationZ = this.camera.rotation.z;
    const startTime = performance.now();

    const animate = () => {
      if (!this.isCameraInclining) {
        return;
      }

      const elapsedTime = performance.now() - startTime;
      const time = elapsedTime * frequency;
      const offsetZ = Math.sin(time) * amplitude * (Math.PI / 180);
      this.camera.rotation.z = initialRotationZ + offsetZ; // Update the camera inclination

      requestAnimationFrame(animate);
    };

    this.isCameraInclining = true;
    requestAnimationFrame(animate);
  }

  /** Stops the camera animation by smoothly returning its inclination to original */
  private stopInclinationAnimation(): void {
    this.isCameraInclining = false;
    const currentRotation = this.camera.rotation.z;
    const targetRotation = 0;
    const duration = 300;
    const startTime = performance.now();

    const smoothReset = (time: number) => {
      const elapsed = time - startTime;
      const t = Math.min(elapsed / duration, 1);
      this.camera.rotation.z = currentRotation + t * (targetRotation - currentRotation);

      if (t < 1) {
        requestAnimationFrame(smoothReset);
      }
    };

    requestAnimationFrame(smoothReset);
  }

  // ----------------------------------
  // FOV RELATED
  // ----------------------------------

  /** Animates the FOV based on the player's velocity */
  private animateFOV(velocity: number): void {
    const targetFOV = Math.min(
      this.NORMAL_FOV + velocity * this.FOV_ANIMATION_SPEED,
      this.MAX_FOV,
    );
    const currentFOV = this.camera.fov;
    const duration = 300;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const t = Math.min(elapsed / duration, 1);
      this.camera.fov = currentFOV + t * (targetFOV - currentFOV);

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  /** Resets the FOV to normal smoothly */
  private resetFOV(): void {
    const currentFOV = this.camera.fov;
    const targetFOV = this.NORMAL_FOV;
    const duration = 300;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const t = Math.min(elapsed / duration, 1);
      this.camera.fov = currentFOV + t * (targetFOV - currentFOV);

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  // Getters and setters

  public getRotationY(): number {
    return this.camera.rotation.y;
  }

  public setCameraHeight(height: number): void {
    this.camera.position.y = height;
  }

  public getCameraPositionY(): number {
    return this.camera.position.y;
  }

  public getCamera(): Camera {
    return this.camera;
  }
}
