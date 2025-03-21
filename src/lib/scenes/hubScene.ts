import { Vector3 } from '@babylonjs/core';
import { GameScene } from './gameScene';
import { FixedStageLayout } from './fixedStageLayout';
import { Bed } from '../interactiveElements/bed';
import { Computer } from '../interactiveElements/computer';
import { AssetType } from '../assets/assetType';

export class HubScene extends GameScene {
  private bed!: Bed;
  private computer!: Computer;

  public async load(): Promise<void> {
    await this.game.assetManager.instantiateSceneFromUnity(FixedStageLayout.HUB);

    this.bed = new Bed(this);
    await this.bed.create(new Vector3(4, 0, 5));

    this.computer = new Computer(this);
    await this.computer.create(new Vector3(0, 1, 15));

    this.game.moneyManager.convertScoreToMoney(this.game.scoreManager.getScore());
    this.game.scoreManager.reset();

    this.game.player.resetHealth();

    this.game.saveManager.save();
  }

  public async dispose(): Promise<void> {
    await super.dispose();
    this.game.assetManager.unloadAsset(FixedStageLayout.HUB, AssetType.SCENE);
    this.bed.dispose();
    this.computer.dispose();
  }
}
