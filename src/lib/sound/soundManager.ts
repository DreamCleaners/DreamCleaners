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
  AMBIANCE = 'ambiances',
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
      'placeholder',
      SoundCategory.MUSIC,
      this.getDefaultStreamingOptions(),
    );
  }

  // ----------------------------------------
  // SOUNDS LOADING
  // ----------------------------------------

  /** Creates a sound based on the name and configuration */
  public async loadMusic(
    name: string,
    type: SoundCategory,
    options?: Partial<IStreamingSoundOptions>,
  ): Promise<void> {
    try {
      const path = this.getPath(name, type);

      // Use a minimal set of options instead of providing everything
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
      case SoundCategory.AMBIANCE:
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
    let path = 'sounds/';
    console.log('', type);
    //path += type + "/";
    // for now everything under /musics
    path += 'musics/';
    path += name + '.mp3';

    return path;
  }

  // ----------------------------------------
  // SOUNDS PLAYING
  // ----------------------------------------

  /** Plays a simple background music, no spatialization. */
  public async playBackgroundMusic(name: string): Promise<void> {
    let sound = this.loadedMusics.get(name);
    if (!sound) {
      console.log('Music not loaded, loading it');
      await this.loadMusic(name, SoundCategory.MUSIC, this.getDefaultStreamingOptions());
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

  public stopSound(name: string, type: SoundCategory): void {
    let sound;

    switch (type) {
      case SoundCategory.MUSIC:
      case SoundCategory.AMBIANCE:
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
      case SoundCategory.AMBIANCE:
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
      case SoundCategory.AMBIANCE:
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

  public stopAllSounds(): void {
    console.log('Stopping all sounds and musics');
    this.loadedMusics.forEach((sound) => {
      sound.stop();
    });
    this.loadedSounds.forEach((sound) => {
      sound.stop();
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
