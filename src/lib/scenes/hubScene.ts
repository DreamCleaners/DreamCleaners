import { Vector3 } from '@babylonjs/core';
import { GameScene } from './gameScene';
import { FixedStageLayout } from './fixedStageLayout';
import { Bed } from '../interactiveElements/bed';
import { Computer } from '../interactiveElements/computer';
import { StagesManager } from '../stages/stagesManager';
import { NavigationManager } from '../navigationManager';

export class HubScene extends GameScene {
  // The entity responsible for determining which stages will be proposed to the player
  private stagesManager = StagesManager.getInstance();

  // Array of the beds in the hub
  private beds: Bed[] = [];
  private computer!: Computer;

  public async load(): Promise<void> {
    const unityScene = await this.game.assetManager.instantiateUnityScene(
      FixedStageLayout.HUB,
    );
    this.gameAssetContainer = unityScene.container;

    unityScene.rootMesh.position = new Vector3(0, 0, 0);

    this.navigationManager = new NavigationManager(
      this.game.recastInjection,
      this.scene,
      0,
    );

    const bedPositions = [
      new Vector3(5, 0, 5),
      new Vector3(-5, 0, 5),
      new Vector3(3, 0, 5),
    ];

    // We create multiple beds in the hub by hand
    for (let i = 0; i < 3; i++) {
      const bed = new Bed(this);
      await bed.create(bedPositions[i]);
      this.beds.push(bed);
    }

    // Once beds are created we give them to the stageManager so that it attributes the beds rewards, difficulty and so on
    this.stagesManager.setProposedStagesForBeds(this.beds);

    this.computer = new Computer(this);
    await this.computer.create(new Vector3(0, 1, 15));

    this.game.moneyManager.convertScoreToMoney(this.game.scoreManager.getScore());
    this.game.scoreManager.reset();

    this.game.player.resetHealth();

    this.game.saveManager.save();
  }

  public dispose(): void {
    super.dispose();
    for (const bed of this.beds) {
      bed.dispose();
    }
    this.computer.dispose();
  }
}
