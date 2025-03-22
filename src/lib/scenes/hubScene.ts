import { Vector3 } from '@babylonjs/core';
import { GameScene } from './gameScene';
import { FixedStageLayout } from './fixedStageLayout';
import { Bed } from '../interactiveElements/bed';
import { Computer } from '../interactiveElements/computer';

export class HubScene extends GameScene {
  private bed!: Bed;
  private computer!: Computer;

  public async load(): Promise<void> {
    const unityScene = await this.game.assetManager.instantiateUnityScene(
      FixedStageLayout.HUB,
    );
    this.gameAssetContainer = unityScene.container;

    unityScene.rootMesh.position = new Vector3(0, 0, 0);

    this.bed = new Bed(this);
    await this.bed.create(new Vector3(4, 0, 5));

    this.computer = new Computer(this);
    await this.computer.create(new Vector3(0, 1, 15));

    this.game.moneyManager.convertScoreToMoney(this.game.scoreManager.getScore());
    this.game.scoreManager.reset();

    this.game.player.resetHealth();

    this.game.saveManager.save();
  }

  public dispose(): void {
    super.dispose();
    this.bed.dispose();
    this.computer.dispose();
  }
}
