import { Vector3 } from '@babylonjs/core';
import { GameScene } from './gameScene';
import { FixedStageLayout } from './fixedStageLayout';
import { Bed } from '../interactiveElements/bed';
import { Computer } from '../interactiveElements/computer';
import { StagesManager } from '../stages/stagesManager';
import { NavigationManager } from '../navigationManager';
import { Workbench } from '../interactiveElements/workbench';
import { Radio } from '../interactiveElements/radio';

export class HubScene extends GameScene {
  // The entity responsible for determining which stages will be proposed to the player
  private stagesManager = StagesManager.getInstance();

  // Array of the beds in the hub
  private beds: Bed[] = [];
  private computer!: Computer;
  private workbench!: Workbench;
  private radio!: Radio;

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
      new Vector3(0, 0, 0),
      new Vector3(0, 0, -6),
      new Vector3(0, 0, 6),
    ];

    // We create multiple beds in the hub by hand
    for (let i = 0; i < bedPositions.length; i++) {
      const bed = new Bed(this);
      await bed.create(bedPositions[i]);
      this.beds.push(bed);
    }

    // Once beds are created we give them to the stageManager so that it attributes the beds rewards, difficulty and so on
    this.stagesManager.setProposedStagesForBeds(
      this.beds,
      this.game.runManager.getStageCompletedCount(),
    );

    this.radio = new Radio(this);
    await this.radio.create(new Vector3(0, 0, 0));

    this.computer = new Computer(this);
    await this.computer.create(new Vector3(0, -0.07, 0));

    this.workbench = new Workbench(this);
    await this.workbench.create(new Vector3(0, 0, 0));

    this.game.moneyManager.addPlayerMoney(
      this.game.scoreManager.convertScoreToMoney(this.game.scoreManager.getScore()),
    );
    this.game.scoreManager.reset();

    this.game.shopManager.resetShop();

    this.game.player.resetHealth();

    this.game.saveManager.save();

    // TP player to 0,1,0
    this.game.player.setPosition(new Vector3(0, 1, 0));

    // PC Ambience
    this.game.soundManager.playHubAmbience();
    this.game.soundManager.radio = this.radio;
  }

  public dispose(): void {
    super.dispose();
    for (const bed of this.beds) {
      bed.dispose();
    }
    this.computer.dispose();
    this.workbench.dispose();
    this.radio.dispose();
  }
}
