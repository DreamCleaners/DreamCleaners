import {
  AudioEngineV2,
  CreateAudioEngineAsync,
  CreateStreamingSoundAsync,
  StreamingSound,
  StaticSound,
  Mesh,
  Vector3,
} from '@babylonjs/core';
/**
 * Interface defining all possible options for sound playback
 */
export interface SoundOptions {
  /** Volume level between 0.0 and 1.0 */
  volume?: number;
  /** Whether the sound should loop */
  loop?: boolean;
  /** Playback speed (1.0 is normal speed) */
  playbackRate?: number;
  /** Time offset in seconds to start playing from */
  startTime?: number;
  /** Whether to use streaming (recommended for longer audio files) */
  streaming?: boolean;
  /** Spatial positioning options */
  spatialSound?: boolean;
  /** Distance model for 3D sounds */
  distanceModel?: string;
  /** Maximum distance at which the sound can be heard */
  maxDistance?: number;
  /** How quickly the sound volume decreases with distance */
  rolloffFactor?: number;
  /** Reference distance for reducing volume as source gets further */
  refDistance?: number;
  /** The 3D position from where the sound should be playing */
  position?: { x: number; y: number; z: number };
}

export class SoundManager {
  private static instance: SoundManager;
  private audioEngine: AudioEngineV2 | null = null;

  // Private constructor for singleton
  private constructor() {}

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public async init(): Promise<void> {
    try {
      this.audioEngine = await CreateAudioEngineAsync();
      await this.audioEngine.unlockAsync();
      console.log('Audio engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
    }
  }

  public getAudioEngine(): AudioEngineV2 | null {
    return this.audioEngine;
  }

  public async playBackgroundMusic(
    musicName: string,
    options?: SoundOptions,
  ): Promise<void> {
    if (!this.audioEngine) {
      console.error('Audio engine is not initialized');
      return;
    }

    const music = await CreateStreamingSoundAsync(
      'placeholder',
      'sounds/musics/' + musicName + '.mp3',
    );

    await this.audioEngine.unlockAsync();

    if (options) this.applyOptionsToSound(music, options);

    music.play();
  }

  /** Plays a sound or a music at specified coordinates. Can also specify a mesh to attach the sound to */
  public async playSoundOrMusicAt(
    soundName: string,
    position?: { x: number; y: number; z: number },
    targetMesh?: Mesh,
    options?: SoundOptions,
  ): Promise<void> {
    if (!this.audioEngine) {
      console.error('Audio engine is not initialized');
      return;
    }

    const sound = await CreateStreamingSoundAsync(
      'placeholder',
      'sounds/sounds/' + soundName + '.mp3',
    );

    await this.audioEngine.unlockAsync();

    if (options) this.applyOptionsToSound(sound, options);

    if (position) {
      sound.spatial.position = new Vector3(position.x, position.y, position.z);
    }

    if (targetMesh) {
      sound.spatial.attach(targetMesh);
    }

    sound.play();
  }

  /**
   * Applies the specified options to a sound object
   * @param sound The sound to configure
   * @param options The options to apply
   */
  private applyOptionsToSound(
    sound: StreamingSound | StaticSound,
    options: SoundOptions,
  ): void {
    // Common properties for both sound types
    if (options.volume !== undefined) sound.volume = options.volume;
    if (options.loop !== undefined) sound.loop = options.loop;

    // Handle StaticSound specific options
    if (sound instanceof StaticSound) {
      // Apply any StaticSound specific properties here
      if (options.playbackRate !== undefined) sound.playbackRate = options.playbackRate;
    }

    // Handle spatial audio for both types, checking capability first
    if (options.spatialSound !== undefined && 'spatialSound' in sound) {
      sound.spatialSound = options.spatialSound;

      // Only apply spatial options if spatialSound is enabled and properties exist on the object
      if (options.spatialSound) {
        if (options.distanceModel !== undefined && 'distanceModel' in sound) {
          sound.distanceModel = options.distanceModel;
        }
        if (options.maxDistance !== undefined && 'maxDistance' in sound) {
          sound.maxDistance = options.maxDistance;
        }
        if (options.rolloffFactor !== undefined && 'rolloffFactor' in sound) {
          sound.rolloffFactor = options.rolloffFactor;
        }
        if (options.refDistance !== undefined && 'refDistance' in sound) {
          sound.refDistance = options.refDistance;
        }
      }
    }

    sound.startOffset = options.startTime || 0; // Default to 0 if not specified
  }
}
