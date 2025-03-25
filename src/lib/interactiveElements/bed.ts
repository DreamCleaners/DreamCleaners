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

// STAGE SELECTION BED
export class Bed extends InteractiveElement {
  // Stage specificities

  public isStageProcedural = false;
  // The proposed stage layout, null if procedural
  public proposedFixedStageLayout: FixedStageLayout | null = null;
  public difficulty = 1;
  public enemyTypes: EnemyType[] = [];

  public stageReward!: StageReward;
  // STAGE SELECTION BED
  override interact(): void {
    // We set the selected bed to this one
    StagesManager.getInstance().setSelectedBed(this);
    // We display the stage selection UI which will seek for the select bed infos
    this.gameScene.game.uiManager.displayUI(UIType.STAGE_SELECTION);
  }

  override async create(position: Vector3): Promise<void> {
    this.gameAssetContainer =
      await this.gameScene.game.assetManager.loadGameAssetContainer(
        'bed',
        AssetType.OBJECT,
      );

    this.mesh = this.gameAssetContainer.addAssetsToScene();
    this.mesh.position = position;
    this.mesh.scaling.scaleInPlace(0.13);

    const bedHitbox = this.mesh.getChildMeshes()[2] as Mesh;
    bedHitbox.metadata = MetadataFactory.createMetadataObject<InteractiveElement>(this, {
      isInteractive: true,
    });
    bedHitbox.name = GameEntityType.BED;

    const physicsAggregate = new PhysicsAggregate(bedHitbox, PhysicsShapeType.BOX, {
      mass: 0,
    });
    this.gameAssetContainer.addPhysicsAggregate(physicsAggregate);
  }

  public setFixedStageProperties(properties: {
    layout: FixedStageLayout;
    difficulty: number;
    enemies: EnemyType[];
    reward: StageReward;
  }): void {
    this.isStageProcedural = false;
    this.proposedFixedStageLayout = properties.layout;
    this.difficulty = properties.difficulty;
    this.enemyTypes = properties.enemies;
    this.stageReward = properties.reward;
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
      this.proposedFixedStageLayout as FixedStageLayout,
      this.difficulty,
      this.enemyTypes,
      this.stageReward,
    );
  }
}
