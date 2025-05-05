import { Mesh, PhysicsAggregate, PhysicsShapeType, Vector3 } from '@babylonjs/core';
import { InteractiveElement } from './interactiveElement';
import { AssetType } from '../assets/assetType';
import { GameEntityType } from '../gameEntityType';
import { MetadataFactory } from '../metadata/metadataFactory';
import { SoundCategory } from '../sound/soundSystem';

export class Radio extends InteractiveElement {
  // Music one has already started, music 2 not started yet
  // Used to know when to use resume() or play()
  private readonly areMusicsStarted = [true, false, false];
  private currentMusic = 1;
  private readonly musicName = 'radioMusic';
  private soundManager = this.gameScene.game.soundManager;
  private switchedOff = false;

  override interact(): void {
    // First of all we play a small tick sound
    this.soundManager.playSound('radioButton', SoundCategory.EFFECT);

    if (this.currentMusic === -1) {
      this.currentMusic = 1;
    }

    if (!this.switchedOff) {
      this.stopCurrentMusic();
      this.currentMusic++;

      // Check if we've reached the end of the available music tracks
      if (this.currentMusic > this.areMusicsStarted.length) {
        this.currentMusic = -1;
        this.switchedOff = true;
        // No need to resume any music when the radio is turned off
        return;
      } else {
        if (this.areMusicsStarted[this.currentMusic - 1]) {
          this.soundManager.resumeSound(
            this.musicName + this.currentMusic,
            SoundCategory.RADIO_MUSIC,
          );
        } else {
          this.soundManager.playRadioMusic(
            this.musicName + this.currentMusic,
            SoundCategory.RADIO_MUSIC,
          );
          this.areMusicsStarted[this.currentMusic - 1] = true;
        }
      }
    } else {
      this.switchedOff = false;

      // Check if the music has been started before
      if (this.areMusicsStarted[this.currentMusic - 1]) {
        this.soundManager.resumeSound(
          this.musicName + this.currentMusic,
          SoundCategory.RADIO_MUSIC,
        );
      } else {
        this.soundManager.playSound(
          this.musicName + this.currentMusic,
          SoundCategory.RADIO_MUSIC,
        );
        this.areMusicsStarted[this.currentMusic - 1] = true;
      }
    }
  }

  override async create(position: Vector3): Promise<void> {
    this.gameAssetContainer =
      await this.gameScene.game.assetManager.loadGameAssetContainer(
        'radio',
        AssetType.OBJECT,
      );

    this.mesh = this.gameAssetContainer.addAssetsToScene();
    this.mesh.position = position;

    const radioHitbox = this.mesh.getChildMeshes()[0] as Mesh;

    radioHitbox.metadata = MetadataFactory.createMetadataObject<InteractiveElement>(
      this,
      {
        isInteractive: true,
      },
    );

    radioHitbox.name = GameEntityType.PC;
    const physicsAggregate = new PhysicsAggregate(radioHitbox, PhysicsShapeType.BOX, {
      mass: 0,
    });
    this.gameAssetContainer.addPhysicsAggregate(physicsAggregate);
  }

  private stopCurrentMusic(): void {
    this.soundManager.pauseSound(
      this.musicName + this.currentMusic,
      SoundCategory.RADIO_MUSIC,
    );
  }

  /** Pauses the currently played music in the radio */
  public pauseRadioMusic(): void {
    if (this.currentMusic === -1) return;

    if (this.areMusicsStarted[this.currentMusic - 1]) {
      this.soundManager.pauseSound(
        this.musicName + this.currentMusic,
        SoundCategory.RADIO_MUSIC,
      );
    }
  }

  /** Resumes the currently played music in the radio */
  public resumeRadioMusic(): void {
    if (this.currentMusic === -1) return;

    if (this.areMusicsStarted[this.currentMusic - 1]) {
      this.soundManager.resumeSound(
        this.musicName + this.currentMusic,
        SoundCategory.RADIO_MUSIC,
      );
    }
  }

  /** Stops all musics in the radio */
  public stopAllMusics(): void {
    for (let i = 0; i < this.areMusicsStarted.length; i++) {
      if (this.areMusicsStarted[i]) {
        this.soundManager.stopSound(this.musicName + (i + 1), SoundCategory.RADIO_MUSIC);
        this.areMusicsStarted[i] = false;
      }
    }
  }
}
