import {
  AudioEngineV2,
  CreateAudioEngineAsync,
  CreateSoundAsync,
  CreateStreamingSoundAsync,
  IStaticSoundOptions,
  IStreamingSoundOptions,
  StaticSound,
  StreamingSound,
  Vector3,
} from '@babylonjs/core';

/**
 * Enum for different sound categories
 */
export enum SoundCategory {
  MUSIC = 'musics',
  EFFECT = 'effects',
  UI = 'ui',
  AMBIENT = 'ambients',
}

export class SoundManager {
  private loadedMusics!: Map<string, StreamingSound>;
  private loadedSounds!: Map<string, StaticSound>;

  private audioEngine!: AudioEngineV2;

  public async init(): Promise<void> {
    this.loadedMusics = new Map<string, StreamingSound>();
    this.loadedSounds = new Map<string, StaticSound>();
    this.audioEngine = await CreateAudioEngineAsync();

    await this.preloadSounds();
    console.log('SoundManager initialized');
  }

  public async preloadSounds(): Promise<void> {
    await this.loadMusic(
      'main-menu',
      'main-menu-default',
      SoundCategory.MUSIC,
      this.mergeAudioOptions({ loop: false }, this.getDefaultStreamingOptions()),
    );

    await this.loadMusic(
      'loading',
      'loading-ambiance',
      SoundCategory.AMBIENT,
      this.getDefaultStreamingOptions(),
    );
  }

  // ----------------------------------------
  // SOUNDS LOADING
  // ----------------------------------------

  /** Creates a sound based on the name and configuration */
  public async loadMusic(
    name_in_file: string,
    name: string,
    type: SoundCategory,
    options?: Partial<IStreamingSoundOptions>,
  ): Promise<void> {
    try {
      const path = this.getPath(name_in_file, type);

      const baseOptions: Partial<IStreamingSoundOptions> = {
        loop: true,
        autoplay: false,
        volume: 0.5,
      };

      // Merge with any user-provided options
      const finalOptions = { ...baseOptions, ...options };

      const sound = await CreateStreamingSoundAsync(name, path, finalOptions);

      this.putIntoMap(name, sound, type);

      console.log('Music loaded: ' + name + ' from ' + path);
    } catch (error) {
      console.error(`Failed to load music "${name}":`, error);
    }
  }

  /** Creates a spatial sound based on the name and configuration */
  public async loadSpatialSound(
    name: string,
    type: SoundCategory,
    options?: Partial<IStaticSoundOptions>,
  ): Promise<void> {
    try {
      const path = this.getPath(name, type);

      // Use a minimal set of options instead of providing everything
      const baseOptions: Partial<IStaticSoundOptions> = {
        loop: false,
        autoplay: false,
        volume: 0.7,
        spatialEnabled: true,
      };

      // Merge with any user-provided options
      const finalOptions = { ...baseOptions, ...options };

      const sound = await CreateSoundAsync(name, path, finalOptions);

      this.putIntoMap(name, sound, type);

      console.log('Spatial sound loaded: ' + name + ' from ' + path);
    } catch (error) {
      console.error(`Failed to load spatial sound "${name}":`, error);
    }
  }

  private putIntoMap(
    name: string,
    sound: StaticSound | StreamingSound,
    type: SoundCategory,
  ) {
    switch (type) {
      case SoundCategory.MUSIC:
      case SoundCategory.AMBIENT:
        this.loadedMusics.set(name, sound as StreamingSound);
        break;

      case SoundCategory.EFFECT:
      case SoundCategory.UI:
        this.loadedSounds.set(name, sound as StaticSound);
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

  public updateSoundOptions(
    name: string,
    type: SoundCategory,
    options: Partial<IStaticSoundOptions | IStreamingSoundOptions>,
  ): void {
    let sound: StaticSound | StreamingSound | undefined;

    switch (type) {
      case SoundCategory.MUSIC:
      case SoundCategory.AMBIENT:
        sound = this.loadedMusics.get(name);
        break;
      case SoundCategory.EFFECT:
      case SoundCategory.UI:
        sound = this.loadedSounds.get(name);
        break;
      default:
        console.error('Unknown sound type: ' + type);
        return;
    }

    if (!sound) {
      console.warn('Sound not found: ' + name);
      return;
    }

    console.log('Updating sound options for: ' + name);

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
        // Add other spatial-specific properties as needed
      }
    }
  }

  // ----------------------------------------
  // SOUNDS PLAYING
  // ----------------------------------------

  /** Plays a simple background music, no spatialization. No options given mean default settings
   * for the music
   * @param name_in_file The name of the file to load, without the extension nor the path
   * @param name The name under which to store the music, i.e one same file can be the object of
   * two different musics, based on different settings for instance
   * @param options The options to use for the music. If not provided, default settings will be used or the ones provided in preload
   */
  public async playBackgroundMusic(
    name_in_file: string,
    name: string,
    options?: Partial<IStreamingSoundOptions>,
  ): Promise<void> {
    let sound = this.loadedMusics.get(name);
    const finalOptions = this.mergeAudioOptions(
      options || {},
      this.getDefaultStreamingOptions(),
    );

    if (!sound) {
      console.log('Music not loaded, loading it');
      await this.loadMusic(name_in_file, name, SoundCategory.MUSIC, finalOptions);
    } else {
      if (options) {
        console.log('Music already loaded, modifying its options with provided ones');
        this.updateSoundOptions(name, SoundCategory.MUSIC, options);
      }
    }

    sound = this.loadedMusics.get(name);

    await this.audioEngine.unlockAsync();

    if (sound) {
      console.log('Playing music: ' + name);
      sound.play();
    } else {
      console.warn('Music not found: ' + name);
    }
  }

  public async playSpatialSoundAt(name: string, position: Vector3): Promise<void> {
    let sound = this.loadedSounds.get(name);
    if (!sound) {
      console.log('Sound not loaded, loading it');
      const options = this.getDefaultStaticOptions();
      options.spatialPosition = position;

      await this.loadSpatialSound(name, SoundCategory.EFFECT, options);
    }

    sound = this.loadedSounds.get(name);

    await this.audioEngine.unlockAsync();

    if (sound) {
      console.log('Playing sound: ' + name + ' at ' + position.toString());
      console.log('Spatial pos: ', sound.spatial.position);
      sound.play();
    } else {
      console.warn('Sound not found: ' + name);
    }
  }

  /** Plays the loading music and pauses every other possible sounds/musics */
  public playLoadingAmbience(): void {
    this.pauseAllSounds();
    // Somehow resuming is necesssary even if we are not playing the sound in the first place
    this.resumeSound('loading-ambiance', SoundCategory.AMBIENT);
    this.playBackgroundMusic('loading', 'loading-ambiance');
  }

  /** Stops the loading music and resumes every other possible sounds/musics */
  public stopLoadingAmbience(): void {
    this.stopSound('loading-ambiance', SoundCategory.AMBIENT);
    this.resumeAllSounds();
  }

  public stopSound(name: string, type: SoundCategory): void {
    let sound;

    switch (type) {
      case SoundCategory.MUSIC:
      case SoundCategory.AMBIENT:
        sound = this.loadedMusics.get(name);
        break;
      case SoundCategory.EFFECT:
      case SoundCategory.UI:
        sound = this.loadedSounds.get(name);
        break;
      default:
        console.error('Unknown sound type: ' + type);
        break;
    }

    if (!sound) {
      console.warn('Sound not loaded: ' + name);
      return;
    }

    console.log('Stopping sound: ' + name);
    sound.stop();
  }

  public pauseSound(name: string, type: SoundCategory): void {
    let sound;

    switch (type) {
      case SoundCategory.MUSIC:
      case SoundCategory.AMBIENT:
        sound = this.loadedMusics.get(name);
        break;
      case SoundCategory.EFFECT:
      case SoundCategory.UI:
        sound = this.loadedSounds.get(name);
        break;
      default:
        console.error('Unknown sound type: ' + type);
        break;
    }
    if (!sound) {
      console.warn('Sound not loaded: ' + name);
      return;
    }

    console.log('Pausing sound: ' + name);
    sound.pause();
  }

  public resumeSound(name: string, type: SoundCategory): void {
    let sound;

    switch (type) {
      case SoundCategory.MUSIC:
      case SoundCategory.AMBIENT:
        sound = this.loadedMusics.get(name);
        break;
      case SoundCategory.EFFECT:
      case SoundCategory.UI:
        sound = this.loadedSounds.get(name);
        break;
      default:
        console.error('Unknown sound type: ' + type);
        break;
    }

    if (!sound) {
      console.warn('Sound not loaded: ' + name);
      return;
    }

    console.log('Resuming sound: ' + name);
    sound.resume();
  }

  public dispose(): void {
    this.loadedMusics.forEach((sound) => {
      sound.dispose();
    });

    this.loadedSounds.forEach((sound) => {
      sound.dispose();
    });

    this.audioEngine.dispose();
    this.loadedMusics.clear();
    this.loadedSounds.clear();
  }

  public pauseAllSounds(): void {
    console.log('Stopping all sounds and musics');
    this.loadedMusics.forEach((sound) => {
      sound.pause();
    });
    this.loadedSounds.forEach((sound) => {
      sound.pause();
    });
  }

  public resumeAllSounds(): void {
    console.log('Resuming all sounds and musics');
    this.loadedMusics.forEach((sound) => {
      if (!(sound.name === 'loading-ambiance')) {
        sound.resume();
        console.log('Resuming: ', sound.name);
      }
    });
    this.loadedSounds.forEach((sound) => {
      sound.resume();
      console.log('Resuming: ', sound.name);
    });
  }

  // ---------------------------------------------
  // Options management
  // ---------------------------------------------

  private getDefaultStreamingOptions(): Partial<IStreamingSoundOptions> {
    return {
      loop: true,
      autoplay: false,
      volume: 0.5,
      stereoEnabled: true,
      spatialEnabled: false,
    };
  }

  private getDefaultStaticOptions(): Partial<IStaticSoundOptions> {
    return {
      loop: false,
      autoplay: false,
      volume: 0.7,
      spatialEnabled: true,
      spatialMaxDistance: 30,
      spatialMinDistance: 1,
      spatialRolloffFactor: 2,
      spatialDistanceModel: 'exponential',
      spatialAutoUpdate: true,
    };
  }

  /**
   * Merges partial audio options with base options of the same type
   * @param partialOptions Partial options that will override base options
   * @param baseOptions Complete base options to be overridden
   * @returns Merged options with partial options taking precedence
   */
  private mergeAudioOptions<
    T extends Partial<IStaticSoundOptions> | Partial<IStreamingSoundOptions>,
  >(partialOptions: T, baseOptions: T): T {
    // Merge base options with partial options (partial overrides base)
    return {
      ...baseOptions,
      ...partialOptions,
    } as T;
  }

  //     private getDefaultStateicOptions(): IStaticSoundOptions{
  //         return {
  //     outBus: null,
  //     autoplay: false,
  //     maxInstances: 0,
  //     loop: false,
  //     startOffset: 0,
  //     volume: 0,
  //     analyzerEnabled: false,
  //     analyzerFFTSize: 32,
  //     analyzerMinDecibels: 0,
  //     analyzerMaxDecibels: 0,
  //     analyzerSmoothing: 0,
  //     spatialAutoUpdate: false,
  //     spatialConeInnerAngle: 0,
  //     spatialConeOuterAngle: 0,
  //     spatialConeOuterVolume: 0,
  //     spatialDistanceModel: "exponential",
  //     spatialEnabled: false,
  //     spatialMaxDistance: 0,
  //     spatialMinUpdateTime: 0,
  //     spatialPanningModel: "equalpower",
  //     spatialPosition: new Vector3,
  //     spatialMinDistance: 0,
  //     spatialRolloffFactor: 0,
  //     spatialRotation: new Vector3,
  //     spatialRotationQuaternion: new Quaternion,
  //     stereoEnabled: false,
  //     stereoPan: 0,
  //     skipCodecCheck: false,
  //     pitch: 0,
  //     playbackRate: 0,
  //     duration: 0,
  //     loopEnd: 0,
  //     loopStart: 0
  // };
  //     }
}
