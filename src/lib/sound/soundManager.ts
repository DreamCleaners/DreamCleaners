import { StaticSound, UniversalCamera, Vector3 } from '@babylonjs/core';
import { SoundSystem, SoundCategory } from './soundSystem';
import { IStaticSoundOptions, IStreamingSoundOptions } from '@babylonjs/core';
import { WeaponType } from '../weapons/weaponType';
import { SpatialSoundManager } from './spatialSoundManager';
import { SpatialSound } from './spatialSound';
import { Player } from '../player/player';
import { EnemyType } from '../enemies/enemyType';
import { Radio } from '../interactiveElements/radio';

enum StageMusic {
  ELECTRO_ONE = 'electroOne',
  ELECTRO_TWO = 'electroTwo',
}

/**
 * High-level sound manager that provides game-specific sound functionality
 */
export class SoundManager {
  private soundSystem: SoundSystem;
  private spatialSoundManager: SpatialSoundManager;

  public cameraListener: UniversalCamera;
  public playerListener: Player;

  // We are forced to hardcode the positions of these static objects are they are not easily accessible
  // In the object fields, because their position is set directly from within the glb object
  private readonly computerPosition = new Vector3(-0.53, 1.8, 4.2);
  private readonly radioPosition = new Vector3(2.779, 1.87, 4.37);
  private readonly bedPositions = [
    new Vector3(4.2, 0.178, -9.26),
    new Vector3(4.2, 0.178, -15.47),
    new Vector3(4.2, 0.178, -21.24),
  ];

  public static readonly DEFAULT_MUSIC_VOLUME = 0.2;

  public radio!: Radio;

  constructor(playerListener: Player) {
    this.soundSystem = new SoundSystem();
    this.spatialSoundManager = new SpatialSoundManager(this.soundSystem);
    this.cameraListener = playerListener.cameraManager.getCamera();
    this.playerListener = playerListener;
  }

  public async init(): Promise<void> {
    await this.soundSystem.init();
    await this.preloadSounds();
  }

  public async preloadSounds(): Promise<void> {
    await this.loadMusic('main-menu', 'main-menu-default', SoundCategory.MUSIC, {
      loop: false,
    });
    await this.loadMusic('hub', 'hub-music', SoundCategory.MUSIC, { loop: true });

    // Radio musics loading
    await this.loadMultipleStreamingSounds(
      ['radioMusic1', 'radioMusic2', 'radioMusic3'],
      SoundCategory.RADIO_MUSIC,
      {
        loop: true,
        volume: 0.2,
        spatialEnabled: true,
        spatialDistanceModel: 'exponential',
        spatialMaxDistance: 15,
        spatialMinDistance: 2,
        spatialRolloffFactor: 1,
        stereoEnabled: false,
        spatialConeInnerAngle: 270,
        spatialConeOuterAngle: 340,
        spatialConeOuterVolume: 0.4,
      },
    );

    // Sleeping ambience loading
    // Sleeping ambience loading
    await this.loadMultipleStreamingSounds(
      ['sleeping0', 'sleeping1', 'sleeping2', 'sleepingEasterEgg'],
      SoundCategory.AMBIENT,
      {
        loop: true,
        volume: 1,
        spatialEnabled: true,
        spatialDistanceModel: 'exponential',
        spatialMaxDistance: 10,
        spatialMinDistance: 2,
        spatialRolloffFactor: 3,
        stereoEnabled: false,
        spatialConeInnerAngle: 270,
        spatialConeOuterAngle: 340,
        spatialConeOuterVolume: 0.4,
      },
    );

    await this.loadMusic('loading', 'loading-ambiance', SoundCategory.AMBIENT);

    // Create sound pools weapon
    await this.createSoundPool('glockShot', 10, { volume: 0.1 });
    await this.createSoundPool('winchesterShot', 6, { volume: 0.2 });
    await this.createSoundPool('sawed-offShot', 6, { volume: 0.2 });
    await this.createSoundPool('aa-12Shot', 8, { volume: 0.2 });
    await this.createSoundPool('peace-of-mindShot', 6, { volume: 0.2 });
    await this.createSoundPool('akShot', 30, { volume: 0.1 });
    await this.createSoundPool('famasShot', 30, { volume: 0.1 });
    await this.createSoundPool('augShot', 30, { volume: 0.1 });
    await this.createSoundPool('revolverShot', 6, { volume: 0.4 });
    await this.createSoundPool('desert-eagleShot', 6, { volume: 0.3 });
    await this.createSoundPool('p90Shot', 6, { volume: 0.2 });

    // Preload all UI sounds, as they are light and used everywhere
    await this.loadStaticSound('uiClick', SoundCategory.UI, {
      loop: false,
      volume: 0.1,
    });

    // Load common effect sounds with same parameters
    await this.loadMultipleStaticSounds(
      [
        'flashlightSwitchOn',
        'flashlightSwitchOff',
        'pcEnter',
        'pcLeave',
        'playerDamageTaken',
      ],
      SoundCategory.EFFECT,
      {
        loop: false,
        volume: 0.5,
      },
    );
    // ...
  }

  // Used to load multiple sounds at once with the same parameters
  private async loadMultipleStreamingSounds(
    soundNames: string[],
    category: SoundCategory,
    options?: Partial<IStreamingSoundOptions>,
  ): Promise<void> {
    for (const name of soundNames) {
      await this.loadMusic(name, name, category, options);
    }
  }

  // Used to load multiple sounds at once with the same parameters
  private async loadMultipleStaticSounds(
    soundNames: string[],
    category: SoundCategory,
    options?: Partial<IStaticSoundOptions>,
  ): Promise<void> {
    for (const name of soundNames) {
      await this.loadStaticSound(name, category, options);
    }
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
      await this.loadMusic(name_in_file, name, SoundCategory.MUSIC, options);
    } else if (options) {
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
      await this.loadStaticSound(name, type, options);
    } else if (options) {
      this.soundSystem.updateSoundOptions(name, type, options);
    }

    await this.soundSystem.unlockAudio();
    this.soundSystem.play(name, type);
  }

  /**
   * Play a spatial sound at the specified position
   * @param name The name of the sound
   * @param position The 3D position to play the sound
   * @param options Optional sound parameters
   * @returns Promise that resolves with the created SpatialSound
   */
  public async playSpatialSoundAt(
    name: string,
    position: Vector3,
    soundType: SoundCategory,
    options?: Partial<IStaticSoundOptions>,
  ): Promise<SpatialSound | undefined> {
    return await this.spatialSoundManager.playSpatialSoundAt(
      name,
      position,
      soundType,
      options,
    );
  }

  public async playRadioMusic(
    name: string,
    soundType: SoundCategory,
    options?: Partial<IStaticSoundOptions>,
  ): Promise<SpatialSound | undefined> {
    return await this.spatialSoundManager.playSpatialSoundAt(
      name,
      this.radioPosition,
      soundType,
      options,
    );
  }

  /**
   * Stops all active spatial sounds
   */
  public stopAllSpatialSounds(): void {
    this.spatialSoundManager.stopAllSpatialSounds();
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

  /**
   * Updates all spatial sounds based on camera position
   * This should be called in your game update loop
   * @param camera The camera representing the listener
   */
  public updateSpatialSounds(): void {
    this.spatialSoundManager.update(this.cameraListener, this.playerListener);
  }

  // ----------------------------------------
  // GAME-SPECIFIC SOUND FUNCTIONALITY
  // ----------------------------------------

  /** Plays the loading music and pauses every other possible sounds/musics */
  public playLoadingAmbience(): void {
    this.stopAllSounds();
    // Resume is somehow necessary even if it was not playing nor paused
    this.soundSystem.resume('loading-ambiance', SoundCategory.AMBIENT);
    this.playBackgroundMusic('loading', 'loading-ambiance');
  }

  /** Stops the loading music and resumes every other possible sounds/musics */
  public stopLoadingAmbience(): void {
    this.soundSystem.stop('loading-ambiance', SoundCategory.AMBIENT);
  }

  public playWeaponShot(type: WeaponType) {
    const soundName = type.toLowerCase() + 'Shot';

    const formattedSoundName = soundName.replace('_', '-');

    try {
      this.playFromPool(formattedSoundName);
    } catch (error) {
      console.warn(`Error playing shoot sound for weapon type ${type}, trace: ${error}`);
    }
  }

  /** Picks a random music for the current stage and plays it */
  public playStageBackgroundMusic(): void {

    // We try to dispose the previous music
    // This is required as all stage musics are loaded with the same name
    // To override the previous one, we need to dispose it first
    this.soundSystem.disposeSound('stageMusic', SoundCategory.MUSIC);
    const musicKeys = Object.keys(StageMusic);

    const randomIndex = Math.floor(Math.random() * musicKeys.length);
    const musicValue = StageMusic[musicKeys[randomIndex] as keyof typeof StageMusic];
    const musicFileName = `stage-music_${musicValue}`;

    // Play the new music
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
    const volume = 0.2;
    const soundName = type.toLowerCase() + 'Reload';
    soundName.replace('_', '-');

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
      volume: SoundManager.DEFAULT_MUSIC_VOLUME / 2,
    });
  }

  public playHubAmbience(): void {
    // Computer sounds
    this.playSpatialSoundAt('pcSound', this.computerPosition, SoundCategory.AMBIENT, {
      loop: true,
      volume: 0.7,
      spatialMaxDistance: 10,
    });

    // Radio music
    this.playSpatialSoundAt('radioMusic1', this.radioPosition, SoundCategory.RADIO_MUSIC);

    // Sleeping ambience
    this.playSleepingAmbience();
  }

  private playSleepingAmbience(): void {
    // Sleeping ambience

    const sleepingAmbienceIndex = Math.floor(Math.random() * 3);

    for (let i = 0; i < this.bedPositions.length; i++) {
      if (Math.random() < 0.05) {
        this.playSpatialSoundAt(
          'sleepingEasterEgg',
          this.bedPositions[i],
          SoundCategory.AMBIENT,
        );
      } else {
        this.playSpatialSoundAt(
          'sleeping' + ((sleepingAmbienceIndex + i) % 3),
          this.bedPositions[i],
          SoundCategory.AMBIENT,
        );
      }
    }
  }

  public playBulletImpactSound(position: Vector3): void {
    this.playSpatialSoundAt('wall-hitmarker', position, SoundCategory.EFFECT, {
      loop: false,
      volume: 0.1,
      spatialMaxDistance: 60,
      spatialRolloffFactor: 20,
    });
  }

  public playEnemyDeath(position: Vector3, enemyType: EnemyType) {
    let path = enemyType + 'Death';
    const n = Math.floor(Math.random() * 3) + 1;
    // 3 possible sounds for the enemy's death
    path += n;

    this.playSpatialSoundAt(path, position, SoundCategory.EFFECT, {
      loop: false,
      volume: 0.5,
      spatialMaxDistance: 60,
      spatialRolloffFactor: 20,
    });
  }

  public playFlashlightSound(isSwitchingOn: boolean): void {
    this.playSound(
      isSwitchingOn ? 'flashlightSwitchOn' : 'flashlightSwitchOff',
      SoundCategory.EFFECT,
    );
  }

  public playPlayerTakesDamage(): void {
    this.playSound('playerDamageTaken', SoundCategory.EFFECT);
  }

  public playPlayerDeath(): void {
    this.playSound('playerDeath', SoundCategory.EFFECT);
  }

  public playEnemyAttackSound(position: Vector3, enemyType: EnemyType): void {
    const path = enemyType + 'Attack';

    this.playSpatialSoundAt(path, position, SoundCategory.EFFECT, {
      loop: false,
      volume: 0.5,
      spatialMaxDistance: 60,
      spatialRolloffFactor: 20,
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
    if (this.radio != undefined) this.radio.pauseRadioMusic();
    this.soundSystem.pauseAllSounds();
  }

  public resumeAllSounds(): void {
    this.radio.resumeRadioMusic();
    this.soundSystem.resumeAllSounds();
  }

  public stopAllSounds(): void {
    if (this.radio) this.radio.stopAllMusics();
    this.soundSystem.stopAllSounds();
  }

  public dispose(): void {
    this.soundSystem.dispose();
    this.spatialSoundManager.dispose();
  }

  // setings related

  public setGlobalVolume(volume: number): void {
    this.soundSystem.setGlobalVolume(volume);
  }

  public getGlobalVolume(): number {
    return this.soundSystem.getGlobalVolume();
  }
}

export { SoundCategory } from './soundSystem';
