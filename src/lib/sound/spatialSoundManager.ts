import { IStaticSoundOptions, StaticSound, UniversalCamera, Vector3 } from '@babylonjs/core';
import { SpatialSound } from './spatialSound';
import { SoundSystem, SoundCategory } from './soundSystem';
import { Player } from '../player/player';

export class SpatialSoundManager {
  private activeSpatialSounds: SpatialSound[] = [];
  private soundSystem: SoundSystem;
  
  // Maximum number of concurrent spatial sounds
  private readonly MAX_CONCURRENT_SOUNDS = 32;

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
    soundCategory: SoundCategory,
    options?: Partial<IStaticSoundOptions>,
  ): Promise<SpatialSound | undefined> {
    this.cleanInactiveSounds();
    
    if (this.activeSpatialSounds.length >= this.MAX_CONCURRENT_SOUNDS) {
      this.stopOldestSound();
    }
    
    // Check if sound exists or load it
    let sound = this.soundSystem.getSound(name, soundCategory);

    if (!sound) {
      // Load the sound
      await this.soundSystem.loadStaticSound(name, soundCategory, options);
      sound = this.soundSystem.getSound(name, soundCategory);

      if (!sound) {
        console.error(`Failed to load spatial sound: ${name}`);
        return undefined;
      }
    }

    const spatialSound = new SpatialSound(sound, position);

    spatialSound.play();
    this.activeSpatialSounds.push(spatialSound);

    return spatialSound;
  }

  /**
   * Updates all active spatial sounds based on camera position
   * @param camera The camera to use as the listener
   */
  public update(camera: UniversalCamera, player: Player): void {
    // Clean up finished sounds first
    this.cleanInactiveSounds();
    
    // Update positions of all active sounds
    for (const sound of this.activeSpatialSounds) {
      sound.updatePosition(camera, player.getPosition());
    }
  }

  /**
   * Remove sounds that have completed playing
   */
  private cleanInactiveSounds(): void {
    const now = Date.now() / 1000;
    
    this.activeSpatialSounds = this.activeSpatialSounds.filter(sound => {
      const soundObj = sound.getSound();
      if (soundObj.loop) return true;
      
      const startTime = sound.getStartTime();
      const duration = soundObj instanceof StaticSound && soundObj.buffer ? 
        soundObj.buffer.duration : 0;
      
      if (startTime > 0 && duration > 0 && now - startTime > duration) {
        sound.stop();
        return false;
      }
      
      return true;
    });
  }

  /**
   * Stops the oldest sound to make room for new ones
   */
  private stopOldestSound(): void {
    if (this.activeSpatialSounds.length > 0) {
      for (let i = 0; i < this.activeSpatialSounds.length; i++) {
        if (!this.activeSpatialSounds[i].getSound().loop) {
          this.activeSpatialSounds[i].stop();
          this.activeSpatialSounds.splice(i, 1);
          return;
        }
      }
      
      this.activeSpatialSounds[0].stop();
      this.activeSpatialSounds.shift();
    }
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