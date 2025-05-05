import {
  Matrix,
  StaticSound,
  StreamingSound,
  UniversalCamera,
  Vector3,
} from '@babylonjs/core';

export class SpatialSound {
  private sound: StaticSound | StreamingSound;
  private startTime: number = 0;
  private position: Vector3;

  constructor(sound: StaticSound | StreamingSound, position?: Vector3) {
    this.sound = sound;
    this.position = position || sound.spatial?.position || new Vector3(0, 0, 0);
    if (sound.spatial) {
      sound.spatial.position = this.position;
    }
  }

  //   /** Returns if the sound is being played, by calculating if we reached the end of the sound duration */
  //   public isPlaying(): boolean {
  //     return (
  //       this.sound.loop ||
  //       (this.startTime > 0 &&
  //         Date.now() / 1000 - this.startTime < this.sound.buffer?.duration)
  //     );
  //   }

  public play(): void {
    this.sound.play();
    this.startTime = Date.now() / 1000;
  }

  public stop(): void {
    this.sound.stop();
    this.startTime = 0;
  }

  public pause(): void {
    this.sound.pause();
  }

  public resume(): void {
    this.sound.resume();
  }

  /**
   * Updates the sound position based on the camera position and rotation for proper spatial audio
   * This makes sounds appear to come from the correct direction relative to the listener's orientation
   */
  public updatePosition(camera: UniversalCamera, playerPos: Vector3): void {
    if (this.sound.spatial && camera) {
      // Calculate the position of the sound relative to the camera's orientation
      // First, get the vector from camera to sound
      const cameraToSound = this.position.subtract(playerPos);

      // Create rotation matrix from camera's rotation quaternion
      const rotationMatrix = new Matrix();
      camera.absoluteRotation.toRotationMatrix(rotationMatrix);

      // Apply inverse of camera rotation to get the relative position
      // This makes the sound appear in the correct direction as the camera rotates
      const relativePosition = Vector3.TransformCoordinates(
        cameraToSound,
        rotationMatrix.invert(),
      );

      // Update the spatial position with this rotated coordinate
      // Sound will be positioned correctly relative to the camera's orientation
      this.sound.spatial.position = relativePosition;

      /* 
        // Calculate attenuation based on distance from camera to sound
        const distanceSquared = Vector3.DistanceSquared(playerPos, this.position);
        const maxDistanceSquared = this.sound.spatial.maxDistance * this.sound.spatial.maxDistance;
        
        // Only update if the sound is within the maximum distance
        if (distanceSquared <= maxDistanceSquared) {
            // Position updates
        }
        */
    }
  }

  /**
   * Set a new position for the spatial sound
   */
  public setPosition(position: Vector3): void {
    this.position = position;
    if (this.sound.spatial) {
      this.sound.spatial.position = position;
    }
  }

  /**
   * Get the current position of the spatial sound
   */
  public getPosition(): Vector3 {
    return this.position;
  }

  /**
   * Get the underlying Babylon sound object
   */
  public getSound(): StaticSound | StreamingSound {
    return this.sound;
  }
}
