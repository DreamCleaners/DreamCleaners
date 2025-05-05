import {
  AudioEngineV2,
  CreateAudioEngineAsync,
  CreateSoundAsync,
  CreateStreamingSoundAsync,
  IStaticSoundOptions,
  IStreamingSoundOptions,
  StaticSound,
  StreamingSound,
} from '@babylonjs/core';

/**
 * Enum for different sound categories
 */
export enum SoundCategory {
  MUSIC = 'musics',
  EFFECT = 'effects',
  UI = 'ui',
  AMBIENT = 'ambients',
  RADIO_MUSIC = 'radio_musics',
}

/**
 * Core sound system that handles the low-level audio operations
 */
export class SoundSystem {
  private loadedMusics: Map<string, StreamingSound>;
  private loadedSounds: Map<string, StaticSound>;
  private loadedUISounds: Map<string, StaticSound>;
  private loadedRadioMusics: Map<string, StaticSound>;
  private audioEngine!: AudioEngineV2;

  // Sound pool related properties
  private soundPools: Map<string, StaticSound[]>;
  private poolSizes: Map<string, number>;
  private currentPoolIndexes: Map<string, number>;

  private globalVolume: number = 1;

  constructor() {
    this.loadedMusics = new Map<string, StreamingSound>();
    this.loadedSounds = new Map<string, StaticSound>();
    this.loadedUISounds = new Map<string, StaticSound>();
    this.soundPools = new Map<string, StaticSound[]>();
    this.poolSizes = new Map<string, number>();
    this.currentPoolIndexes = new Map<string, number>();
    this.loadedRadioMusics = new Map<string, StaticSound>();
  }

  public async init(): Promise<void> {
    this.globalVolume = parseFloat(window.localStorage.getItem('globalVolume') ?? '1');
    this.audioEngine = await CreateAudioEngineAsync({ volume: this.globalVolume });
    this.setGlobalVolume(this.globalVolume);
  }

  // ----------------------------------------
  // SOUNDS LOADING
  // ----------------------------------------

  /** Creates a streaming sound based on the name and configuration */
  public async loadStreamingSound(
    name_in_file: string,
    name: string,
    type: SoundCategory,
    options?: Partial<IStreamingSoundOptions>,
  ): Promise<void> {
    try {
      const path = this.getPath(name_in_file, type);
      const finalOptions = this.mergeAudioOptions(
        options || {},
        this.getDefaultStreamingOptions(),
      );

      const sound = await CreateStreamingSoundAsync(name, path, finalOptions);
      this.putIntoMap(name, sound, type);
    } catch (error) {
      console.error(`Failed to load streaming sound "${name}":`, error);
    }
  }

  /** Creates a static/spatial sound based on the name and configuration */
  public async loadStaticSound(
    name: string,
    type: SoundCategory,
    options?: Partial<IStaticSoundOptions>,
  ): Promise<void> {
    try {
      const path = this.getPath(name, type);
      const finalOptions = this.mergeAudioOptions(
        options || {},
        this.getDefaultStaticOptions(),
      );

      const sound = await CreateSoundAsync(name, path, finalOptions);
      this.putIntoMap(name, sound, type);
    } catch (error) {
      console.error(`Failed to load static sound "${name}":`, error);
    }
  }

  /**
   * Creates a pool of sounds for effects that need to be played rapidly
   * @param name Base name for the sounds
   * @param type Sound category
   * @param poolSize Number of instances to create
   * @param options Sound options
   */
  public async createSoundPool(
    name: string,
    type: SoundCategory,
    poolSize: number = 8,
    options?: Partial<IStaticSoundOptions>,
  ): Promise<void> {
    // Keep track of the pool size
    this.poolSizes.set(name, poolSize);
    this.currentPoolIndexes.set(name, 0);
    const soundPool: StaticSound[] = [];

    try {
      const path = this.getPath(name, type);
      const finalOptions = this.mergeAudioOptions(
        options || {},
        this.getDefaultStaticOptions(),
      );

      // Create multiple instances of the same sound
      for (let i = 0; i < poolSize; i++) {
        const instanceName = `${name}_pool_${i}`;
        const sound = await CreateSoundAsync(instanceName, path, finalOptions);
        soundPool.push(sound);
      }

      this.soundPools.set(name, soundPool);
    } catch (error) {
      console.error(`Failed to create sound pool for "${name}":`, error);
    }
  }

  private putIntoMap(
    name: string,
    sound: StaticSound | StreamingSound,
    type: SoundCategory,
  ): void {
    switch (type) {
      case SoundCategory.MUSIC:
      case SoundCategory.AMBIENT:
        this.loadedMusics.set(name, sound as StreamingSound);
        break;
      case SoundCategory.EFFECT:
        this.loadedSounds.set(name, sound as StaticSound);
        break;
      case SoundCategory.UI:
        this.loadedUISounds.set(name, sound as StaticSound);
        break;
      case SoundCategory.RADIO_MUSIC:
        this.loadedRadioMusics.set(name, sound as StaticSound);
        break;
      default:
        console.error('Unknown sound type: ' + type);
        break;
    }
  }

  private getPath(name: string, type: SoundCategory): string {
    let path = 'audio/';
    path += type + '/';
    path += name + '.mp3';
    return path;
  }

  // ----------------------------------------
  // SOUND CONTROL
  // ----------------------------------------

  public async unlockAudio(): Promise<void> {
    await this.audioEngine.unlockAsync();
  }

  public getSound(
    name: string,
    type: SoundCategory,
  ): StaticSound | StreamingSound | undefined {
    switch (type) {
      case SoundCategory.MUSIC:
      case SoundCategory.AMBIENT:
        return this.loadedMusics.get(name);
      case SoundCategory.EFFECT:
        return this.loadedSounds.get(name);
      case SoundCategory.UI:
        return this.loadedUISounds.get(name);
      case SoundCategory.RADIO_MUSIC:
        return this.loadedRadioMusics.get(name);
      default:
        console.error('Unknown sound type: ' + type);
        return undefined;
    }
  }

  public updateSoundOptions(
    name: string,
    type: SoundCategory,
    options: Partial<IStaticSoundOptions | IStreamingSoundOptions>,
  ): void {
    const sound = this.getSound(name, type);

    if (!sound) {
      console.warn('Sound not found: ' + name);
      return;
    }

    // Update common properties
    if (options.volume !== undefined) sound.volume = options.volume;
    if (options.loop !== undefined) sound.loop = options.loop;

    if (sound instanceof StaticSound) {
      const staticOptions = options as Partial<IStaticSoundOptions>;
      // Update spatial properties
      if (sound.spatial) {
        if (staticOptions.spatialPosition)
          sound.spatial.position = staticOptions.spatialPosition;
        if (staticOptions.spatialMaxDistance !== undefined)
          sound.spatial.maxDistance = staticOptions.spatialMaxDistance;
        if (staticOptions.spatialMinDistance !== undefined)
          sound.spatial.minDistance = staticOptions.spatialMinDistance;
        if (staticOptions.spatialRolloffFactor !== undefined)
          sound.spatial.rolloffFactor = staticOptions.spatialRolloffFactor;
      }
    }
  }

  /**
   * Plays a sound from a pool using a round-robin approach
   * @param name The name of the sound pool
   * @param options Optional sound settings to override
   */
  public playFromPool(name: string, options?: Partial<IStaticSoundOptions>): void {
    const soundPool = this.soundPools.get(name);

    if (!soundPool || soundPool.length === 0) {
      console.warn(`Sound pool "${name}" not found or empty`);
      return;
    }

    // Get the current index for this pool, or initialize to 0
    let currentIndex = this.currentPoolIndexes.get(name) || 0;

    // Get the sound at the current index
    const sound = soundPool[currentIndex];

    // Apply options if provided
    if (options) {
      if (options.volume !== undefined) sound.volume = options.volume;
      if (options.spatialEnabled && sound.spatial && options.spatialPosition) {
        sound.spatial.position = options.spatialPosition;
      }
    }

    // Stop the sound (in case it's still playing) and play it again
    sound.stop();
    sound.play();

    // Increment the index for next time, wrapping around if needed
    currentIndex = (currentIndex + 1) % soundPool.length;
    this.currentPoolIndexes.set(name, currentIndex);
  }

  public play(name: string, type: SoundCategory): void {
    const sound = this.getSound(name, type);

    if (!sound) {
      console.warn('Sound not found: ' + name);
      return;
    }

    sound.play();
  }

  public stop(name: string, type: SoundCategory): void {
    const sound = this.getSound(name, type);

    if (!sound) {
      console.warn('Sound not found: ' + name);
      return;
    }

    sound.stop();
  }

  public pause(name: string, type: SoundCategory): void {
    const sound = this.getSound(name, type);

    if (!sound) {
      console.warn('Sound not found: ' + name);
      return;
    }

    sound.pause();
  }

  public resume(name: string, type: SoundCategory): void {
    const sound = this.getSound(name, type);

    if (!sound) {
      console.warn('Sound not found: ' + name);
      return;
    }

    sound.resume();
  }

  /** Stops all sounds (expect UI) */
  public stopAllSounds(): void {
    this.loadedMusics.forEach((sound) => sound.stop());
    this.loadedSounds.forEach((sound) => sound.stop());
  }

  public pauseAllSounds(): void {
    this.loadedMusics.forEach((sound) => sound.pause());
    this.loadedSounds.forEach((sound) => sound.pause());
  }

  public resumeAllSounds(): void {
    this.loadedMusics.forEach((sound) => {
      sound.resume();
    });
    this.loadedSounds.forEach((sound) => {
      sound.resume();
    });
  }

  public dispose(): void {
    this.loadedMusics.forEach((sound) => sound.dispose());
    this.loadedSounds.forEach((sound) => sound.dispose());

    // Clean up sound pools
    this.soundPools.forEach((pool) => {
      pool.forEach((sound) => sound.dispose());
    });

    this.soundPools.clear();
    this.poolSizes.clear();
    this.currentPoolIndexes.clear();

    this.audioEngine.dispose();
    this.loadedMusics.clear();
    this.loadedSounds.clear();
  }

  // ---------------------------------------------
  // Options management
  // ---------------------------------------------

  public getDefaultStreamingOptions(): Partial<IStreamingSoundOptions> {
    return {
      loop: true,
      autoplay: false,
      volume: 0.5,
      stereoEnabled: true,
      spatialEnabled: false,
    };
  }

  public getDefaultStaticOptions(): Partial<IStaticSoundOptions> {
    return {
      loop: false,
      autoplay: false,
      volume: 0.7,
      spatialEnabled: true,
      spatialMaxDistance: 15,
      spatialMinDistance: 1,
      spatialRolloffFactor: 3,
      spatialDistanceModel: 'linear',
      spatialAutoUpdate: false,
    };
  }

  /**
   * Merges partial audio options with base options of the same type
   */
  private mergeAudioOptions<
    T extends Partial<IStaticSoundOptions> | Partial<IStreamingSoundOptions>,
  >(partialOptions: T, baseOptions: T): T {
    return {
      ...baseOptions,
      ...partialOptions,
    } as T;
  }

  public setGlobalVolume(volume: number): void {
    this.globalVolume = volume;
    this.audioEngine.volume = volume;

    window.localStorage.setItem('globalVolume', volume.toString());
  }

  public getGlobalVolume(): number {
    return this.globalVolume;
  }
}
