import { IStaticSoundOptions, StaticSound, UniversalCamera, Vector3 } from '@babylonjs/core';
import { SpatialSound } from './spatialSound';
import { SoundSystem, SoundCategory } from './soundSystem';
import { Player } from '../player/player';

export class SpatialSoundManager {
  private activeSpatialSounds: SpatialSound[] = [];
  private soundSystem: SoundSystem;
  private cleanupInterval: number = 5000; // Cleanup every 5 seconds
  private lastCleanup: number = 0;

  constructor(soundSystem: SoundSystem) {
    this.soundSystem = soundSystem;
  }

  /**
   * Creates and plays a spatial sound at the specified position
   * @param name The name of the sound
   * @param position The 3D position to play the sound at
   * @param options Additional sound options
   * @returns The created SpatialSound object
   */
  public async playSpatialSoundAt(
    name: string,
    position: Vector3,
    options?: Partial<IStaticSoundOptions>,
  ): Promise<SpatialSound | undefined> {
    // Check if sound exists or load it
    let sound = this.soundSystem.getSound(name, SoundCategory.EFFECT) as StaticSound;

    if (!sound) {
      // Load the sound
      await this.soundSystem.loadStaticSound(name, SoundCategory.EFFECT, options);
      sound = this.soundSystem.getSound(name, SoundCategory.EFFECT) as StaticSound;

      if (!sound) {
        console.error(`Failed to load spatial sound: ${name}`);
        return undefined;
      }
    }

    // Create spatial sound wrapper
    const spatialSound = new SpatialSound(sound, position);

    // Start playing and add to tracked sounds
    spatialSound.play();
    this.activeSpatialSounds.push(spatialSound);

    return spatialSound;
  }

  /**
   * Updates all active spatial sounds based on camera position
   * @param camera The camera to use as the listener
   */
  public update(camera: UniversalCamera, player: Player): void {
    const currentTime = Date.now();

    // Update positions of all active sounds
    for (const sound of this.activeSpatialSounds) {
      sound.updatePosition(camera, player.getPosition());
    }

    // Periodically clean up finished sounds
    if (currentTime - this.lastCleanup > this.cleanupInterval) {
      this.cleanupFinishedSounds();
      this.lastCleanup = currentTime;
    }
  }

  /**
   * Removes finished sounds from the tracking list
   */
  private cleanupFinishedSounds(): void {
    this.activeSpatialSounds = this.activeSpatialSounds.filter((sound) =>
      sound.isPlaying(),
    );
  }

  /**
   * Stops and removes all active spatial sounds
   */
  public stopAllSpatialSounds(): void {
    for (const sound of this.activeSpatialSounds) {
      sound.stop();
    }
    this.activeSpatialSounds = [];
  }

  /**
   * Get the number of currently active spatial sounds
   */
  public getActiveSoundCount(): number {
    return this.activeSpatialSounds.length;
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.stopAllSpatialSounds();
  }
}
