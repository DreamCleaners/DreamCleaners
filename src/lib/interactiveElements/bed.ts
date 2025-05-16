import { Mesh, PhysicsAggregate, PhysicsShapeType, Vector3 } from '@babylonjs/core';
import { InteractiveElement } from './interactiveElement';
import { EnemyType } from '../enemies/enemyType';
import { FixedStageLayout } from '../scenes/fixedStageLayout';
import { AssetType } from '../assets/assetType';
import { GameEntityType } from '../gameEntityType';
import { StageReward } from '../stages/stageReward';
import { MetadataFactory } from '../metadata/metadataFactory';
import { UIType } from '../ui/uiType';
import { StagesManager } from '../stages/stagesManager';
import { StageInformation } from '../stages/stageInformation';

// STAGE SELECTION BED
export class Bed extends InteractiveElement {
  // Stage specificities
  public stageInfo!: StageInformation;

  // STAGE SELECTION BED
  override interact(): void {
    // We set the selected bed to this one
    StagesManager.getInstance().setSelectedBed(this);
    // We display the stage selection UI which will seek for the select bed infos
    this.gameScene.game.uiManager.displayUI(UIType.STAGE_SELECTION);
  }

  override async create(position: Vector3): Promise<void> {
    const targetBedMesh = 'bed' + (Math.floor(Math.random() * 3) + 1);

    this.gameAssetContainer =
      await this.gameScene.game.assetManager.loadGameAssetContainer(
        targetBedMesh,
        AssetType.OBJECT,
      );

    this.mesh = this.gameAssetContainer.addAssetsToScene();
    this.mesh.position = position;

    const bedHitbox = this.mesh.getChildMeshes()[0] as Mesh;
    bedHitbox.metadata = MetadataFactory.createMetadataObject<InteractiveElement>(this, {
      isInteractive: true,
    });
    bedHitbox.name = GameEntityType.BED;

    const physicsAggregate = new PhysicsAggregate(bedHitbox, PhysicsShapeType.BOX, {
      mass: 0,
    });
    this.gameAssetContainer.addPhysicsAggregate(physicsAggregate);
  }

  public setStageInfo(properties: {
    isProcedural: boolean;
    layout: FixedStageLayout;
    difficulty: number;
    enemies: EnemyType[];
    reward: StageReward;
    description: string;
  }): void {
    this.stageInfo = new StageInformation(
      properties.isProcedural,
      properties.layout,
      properties.difficulty,
      properties.enemies,
      properties.reward,
      properties.description,
    );
  }

  // public setProceduralStageProperties(properties: {
  //   difficulty: number;
  //   enemies: EnemyType[];
  //   reward: StageReward;
  // }): void {
  //   // Not implemented yet
  // }

  public enterStage(): void {
    this.gameScene.game.sceneManager.changeSceneToFixedStage(
      this.stageInfo.proposedFixedStageLayout as FixedStageLayout,
      this.stageInfo.difficulty,
      this.stageInfo.enemyTypes,
      this.stageInfo.stageReward,
      this.stageInfo.description,
    );
  }
}
