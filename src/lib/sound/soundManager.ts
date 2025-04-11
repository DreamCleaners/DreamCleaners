import { Vector3 } from '@babylonjs/core';
import { SoundSystem, SoundCategory } from './soundSystem';
import { IStaticSoundOptions, IStreamingSoundOptions } from '@babylonjs/core';
import { WeaponType } from '../weapons/weaponType';

/**
 * High-level sound manager that provides game-specific sound functionality
 */
export class SoundManager {
  private soundSystem: SoundSystem;

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

    await this.loadMusic('loading', 'loading-ambiance', SoundCategory.AMBIENT);

    // Create sound pools weapon (and UI?)
    await this.createSoundPool('glockShot', 10, { volume: 0.1 });
    await this.createSoundPool('shotgunShot', 6, { volume: 0.2 });
    await this.createSoundPool('akShot', 30, { volume: 0.1 });
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

  /** Creates a spatial sound based on the name and configuration */
  public async loadSpatialSound(
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

  public async playSpatialSoundAt(name: string, position: Vector3): Promise<void> {
    const sound = this.soundSystem.getSound(name, SoundCategory.EFFECT);

    if (!sound) {
      console.log('Sound not loaded, loading it');
      const options = this.soundSystem.getDefaultStaticOptions();
      options.spatialPosition = position;
      await this.loadSpatialSound(name, SoundCategory.EFFECT, options);
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

  // ----------------------------------------
  // GAME-SPECIFIC SOUND FUNCTIONALITY
  // ----------------------------------------

  /** Plays the loading music and pauses every other possible sounds/musics */
  public playLoadingAmbience(): void {
    this.soundSystem.pauseAllSounds();
    this.soundSystem.resume('loading-ambiance', SoundCategory.AMBIENT);
    this.playBackgroundMusic('loading', 'loading-ambiance');
  }

  /** Stops the loading music and resumes every other possible sounds/musics */
  public stopLoadingAmbience(): void {
    this.soundSystem.stop('loading-ambiance', SoundCategory.AMBIENT);
    this.soundSystem.resumeAllSounds();
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
