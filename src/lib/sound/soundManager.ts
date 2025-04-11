import { StaticSound, Vector3 } from '@babylonjs/core';
import { SoundSystem, SoundCategory } from './soundSystem';
import { IStaticSoundOptions, IStreamingSoundOptions } from '@babylonjs/core';
import { WeaponType } from '../weapons/weaponType';

enum StageMusic {
  MUSIC_ONE = 'placeholder1',
  MUSIC_TWO = 'placeholder2',
  MUSIC_THREE = 'placeholder3',
}

/**
 * High-level sound manager that provides game-specific sound functionality
 */
export class SoundManager {
  private soundSystem: SoundSystem;

  public static readonly DEFAULT_MUSIC_VOLUME = 0.2;

  constructor() {
    this.soundSystem = new SoundSystem();
  }

  public async init(): Promise<void> {
    await this.soundSystem.init();
    await this.preloadSounds();
    console.log('SoundManager initialized');
  }

  public async preloadSounds(): Promise<void> {
    await this.loadMusic('main-menu', 'main-menu-default', SoundCategory.MUSIC, {
      loop: false,
    });
    await this.loadMusic('hub', 'hub-music', SoundCategory.MUSIC, { loop: true });

    await this.loadMusic('loading', 'loading-ambiance', SoundCategory.AMBIENT);

    // Create sound pools weapon (and UI?)
    await this.createSoundPool('glockShot', 10, { volume: 0.1 });
    await this.createSoundPool('shotgunShot', 6, { volume: 0.2 });
    await this.createSoundPool('akShot', 30, { volume: 0.1 });

    // Preload all UI sounds, as they are light and used everywhere
    await this.loadStaticSound('placeholder', SoundCategory.UI, {
      loop: false,
      volume: 0.1,
    });

    // ...
  }

  // ----------------------------------------
  // HIGH-LEVEL SOUND OPERATIONS
  // ----------------------------------------

  /** Creates a sound based on the name and configuration */
  public async loadMusic(
    name_in_file: string,
    name: string,
    type: SoundCategory,
    options?: Partial<IStreamingSoundOptions>,
  ): Promise<void> {
    await this.soundSystem.loadStreamingSound(name_in_file, name, type, options);
  }

  /** Creates a static sound based on the name and configuration. Can be spatialized */
  public async loadStaticSound(
    name: string,
    type: SoundCategory,
    options?: Partial<IStaticSoundOptions>,
  ): Promise<void> {
    await this.soundSystem.loadStaticSound(name, type, options);
  }

  /** Plays a simple background music, no spatialization */
  public async playBackgroundMusic(
    name_in_file: string,
    name: string,
    options?: Partial<IStreamingSoundOptions>,
  ): Promise<void> {
    const sound = this.soundSystem.getSound(name, SoundCategory.MUSIC);

    if (!sound) {
      console.log('Music not loaded, loading it');
      await this.loadMusic(name_in_file, name, SoundCategory.MUSIC, options);
    } else if (options) {
      console.log('Music already loaded, modifying its options with provided ones');
      this.soundSystem.updateSoundOptions(name, SoundCategory.MUSIC, options);
    }

    await this.soundSystem.unlockAudio();
    this.soundSystem.play(name, SoundCategory.MUSIC);
  }

  public async playSound(
    name: string,
    type: SoundCategory,
    options?: Partial<IStaticSoundOptions>,
  ): Promise<void> {
    const sound = this.soundSystem.getSound(name, type);

    if (!sound) {
      console.log('Sound not loaded, loading it');
      await this.loadStaticSound(name, type, options);
    } else if (options) {
      console.log('Sound already loaded, modifying its options with provided ones');
      this.soundSystem.updateSoundOptions(name, type, options);
    }

    await this.soundSystem.unlockAudio();
    this.soundSystem.play(name, type);
  }

  public async playSpatialSoundAt(name: string, position: Vector3): Promise<void> {
    const sound = this.soundSystem.getSound(name, SoundCategory.EFFECT);

    if (!sound) {
      console.log('Sound not loaded, loading it');
      const options = this.soundSystem.getDefaultStaticOptions();
      options.spatialPosition = position;
      await this.loadStaticSound(name, SoundCategory.EFFECT, options);
    } else {
      // Update position for existing sound
      this.soundSystem.updateSoundOptions(name, SoundCategory.EFFECT, {
        spatialPosition: position,
      });
    }

    await this.soundSystem.unlockAudio();
    this.soundSystem.play(name, SoundCategory.EFFECT);
  }

  /**
   * Preload a sound pool for effects that need to be played rapidly
   * @param soundName The base name of the sound
   * @param poolSize Number of simultaneous instances
   * @param options Sound options
   */
  public async createSoundPool(
    soundName: string,
    poolSize: number = 8,
    options?: Partial<IStaticSoundOptions>,
  ): Promise<void> {
    // Default non-spatial, non-looping sound options
    const defaultOptions: Partial<IStaticSoundOptions> = {
      loop: false,
      autoplay: false,
      volume: 0.7,
      spatialEnabled: false,
    };

    // Merge with any provided options
    const finalOptions = {
      ...defaultOptions,
      ...options,
    };

    await this.soundSystem.createSoundPool(
      soundName,
      SoundCategory.EFFECT,
      poolSize,
      finalOptions,
    );
  }

  /**
   * Play sound from a pool
   * @param soundName The name of the sound pool
   * @param volume Optional volume override
   */
  public playFromPool(soundName: string, volume?: number): void {
    const options: Partial<IStaticSoundOptions> = {};

    if (volume !== undefined) {
      options.volume = volume;
    }

    this.soundSystem.playFromPool(soundName, options);
  }

  /**
   * Play sound from a pool with spatial positioning
   * @param soundName The name of the sound pool
   * @param position Position to play at
   * @param volume Optional volume override
   */
  public playSpatialFromPool(
    soundName: string,
    position: Vector3,
    volume?: number,
  ): void {
    const options: Partial<IStaticSoundOptions> = {
      spatialPosition: position,
    };

    if (volume !== undefined) {
      options.volume = volume;
    }

    this.soundSystem.playFromPool(soundName, options);
  }

  /**
   * Get the duration of a loaded static sound
   * @param name The name of the sound
   * @param type The sound category
   * @returns Duration in seconds, or -1 if sound not found
   */
  private getSoundDuration(name: string, type: SoundCategory): number {
    const sound = this.soundSystem.getSound(name, type) as StaticSound;

    if (!sound) {
      console.warn(`Sound "${name}" not found or not loaded yet`);
      return -1;
    }

    // Check if it's a static sound
    if (type == SoundCategory.MUSIC) {
      console.warn(`Sound "${name}" is not a static sound`);
      return -1;
    }

    if (sound.buffer) {
      // We get the duration of the sound buffer
      return sound.buffer.duration;
    }

    return -1;
  }

  // ----------------------------------------
  // GAME-SPECIFIC SOUND FUNCTIONALITY
  // ----------------------------------------

  /** Plays the loading music and pauses every other possible sounds/musics */
  public playLoadingAmbience(): void {
    this.soundSystem.stopAllSounds();
    // Resume is somehow necessary even if it was not playing nor paused
    this.soundSystem.resume('loading-ambiance', SoundCategory.AMBIENT);
    this.playBackgroundMusic('loading', 'loading-ambiance');
  }

  /** Stops the loading music and resumes every other possible sounds/musics */
  public stopLoadingAmbience(): void {
    this.soundSystem.stop('loading-ambiance', SoundCategory.AMBIENT);
  }

  public playWeaponShot(type: WeaponType) {
    switch (type) {
      case WeaponType.GLOCK:
        this.playFromPool('glockShot');
        break;
      case WeaponType.SHOTGUN:
        this.playFromPool('shotgunShot');
        break;
      case WeaponType.AK:
        this.playFromPool('akShot');
        break;
      default:
        console.warn(`No sound for weapon type ${type}`);
        break;
    }
  }

  /** Picks a random music for the current stage and plays it */
  public playStageBackgroundMusic(): void {
    const musicKeys = Object.keys(StageMusic);

    const randomIndex = Math.floor((Math.random() * musicKeys.length) / 2);
    const musicValue = StageMusic[musicKeys[randomIndex] as keyof typeof StageMusic];
    const musicFileName = `stage-music_${musicValue}`;

    console.log(`Playing random stage music: ${musicValue} (${musicFileName})`);

    // Play the new music (use same name for both parameters)
    this.playBackgroundMusic(musicFileName, 'stageMusic', {
      loop: true,
      volume: SoundManager.DEFAULT_MUSIC_VOLUME,
    });
  }

  /** Stops the current stage music from playing */
  public stopStageBackgroundMusic(): void {
    this.soundSystem.stop('stageMusic', SoundCategory.MUSIC);
  }

  /**
   * Play weapon reload sound and adjust its playback rate to match the given reload time
   * @param type The weapon type
   * @param reloadTime Game logic reload time in seconds
   * @returns Promise that resolves when sound starts playing
   */
  public async playWeaponReload(type: WeaponType, reloadTime: number): Promise<void> {
    let soundName!: string;
    let volume = 0.5;
    switch (type) {
      case WeaponType.GLOCK:
        soundName = 'glockReload';
        volume = 0.2;
        break;
      case WeaponType.SHOTGUN:
        soundName = 'shotgunReload';
        volume = 0.35;
        break;
      case WeaponType.AK:
        soundName = 'akReload';
        volume = 0.2;
        break;
      default:
        console.warn(`No sound for weapon type ${type}`);
    }

    // Check if sound is already loaded
    let sound = this.soundSystem.getSound(soundName, SoundCategory.EFFECT) as StaticSound;

    // If not loaded, load it first
    if (!sound) {
      await this.loadStaticSound(soundName, SoundCategory.EFFECT, {
        loop: false,
        autoplay: false,
        volume: volume,
        spatialEnabled: false,
      });

      sound = this.soundSystem.getSound(soundName, SoundCategory.EFFECT) as StaticSound;
    }

    const originalDuration = this.getSoundDuration(soundName, SoundCategory.EFFECT);

    // We modify the playback rate of the sound to match the reload time
    // Basically we accelerate the sound to match the reload time
    if (originalDuration > 0) {
      // Calculate playback rate to match the desired reload time
      // Original duration / playback rate = desired duration
      // So: playback rate = original duration / desired duration
      const playbackRate = originalDuration / reloadTime;

      // We put a limiter on the playback rate, speed factor of 6x is the max and 0.4x is the min
      const clampedRate = Math.max(0.4, Math.min(playbackRate, 6.0));

      // Update the sound's playback rate
      if (sound) {
        sound.playbackRate = clampedRate;
      }
    }

    await this.soundSystem.unlockAudio();

    this.soundSystem.play(soundName, SoundCategory.EFFECT);
  }

  public playHubMusic(): void {
    this.soundSystem.stopAllSounds();
    this.soundSystem.resume('hub-music', SoundCategory.MUSIC);
    this.playBackgroundMusic('hub', 'hub-music', {
      volume: SoundManager.DEFAULT_MUSIC_VOLUME,
    });
  }

  // ----------------------------------------
  // OPERATIONS DELEGATED TO SOUND SYSTEM
  // ----------------------------------------

  public stopSound(name: string, type: SoundCategory): void {
    this.soundSystem.stop(name, type);
  }

  public pauseSound(name: string, type: SoundCategory): void {
    this.soundSystem.pause(name, type);
  }

  public resumeSound(name: string, type: SoundCategory): void {
    this.soundSystem.resume(name, type);
  }

  public pauseAllSounds(): void {
    this.soundSystem.pauseAllSounds();
  }

  public resumeAllSounds(): void {
    this.soundSystem.resumeAllSounds();
  }

  public dispose(): void {
    this.soundSystem.dispose();
  }
}

export { SoundCategory } from './soundSystem';
