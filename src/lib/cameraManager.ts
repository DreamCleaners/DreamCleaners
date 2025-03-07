import { Camera, UniversalCamera, Vector3 } from '@babylonjs/core';
import { Player } from './player';

export class CameraManager {
  private camera!: UniversalCamera;
  private isAnimating: boolean = false; // Add a flag to track if the animation is running

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
  }

  public updateCamera(playerVelocity: Vector3): void {
    // Based on the player's velocity, we are going to move the camera around a bit to give a sense of speed

    if (playerVelocity.length() > 0) {
      // Player is moving
      if (!this.isAnimating) {
        this.animateCameraPlayerWalking();
      }
    } else {
      // Player stopped moving
      this.stopAnimation();
    }
    if (this.player.isSliding) {
      this.stopAnimation();
    }
  }

  private animateCameraPlayerWalking(): void {
    const amplitude = 1.8; // The camera inclination
    const frequency = 0.003; // Adjust the frequency for the desired speed
    this.isAnimating = true; // Set the flag to indicate the animation is running
    const initialRotationZ = this.camera.rotation.z; // Store the initial camera rotation
    const startTime = performance.now(); // Store the start time of the animation

    const animate = () => {
      if (!this.isAnimating) {
        return;
      }

      const elapsedTime = performance.now() - startTime; // Calculate elapsed time
      const time = elapsedTime * frequency;
      const offsetZ = Math.sin(time) * amplitude * (Math.PI / 180);
      this.camera.rotation.z = initialRotationZ + offsetZ; // Start from the initial rotation

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  private stopAnimation(): void {
    if (this.isAnimating) {
      this.isAnimating = false;
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
  }

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
