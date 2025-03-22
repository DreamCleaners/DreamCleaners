import { Mesh, PhysicsAggregate, PhysicsShapeType, Vector3 } from '@babylonjs/core';
import { InteractiveElement } from './interactiveElement';
import { EnemyType } from '../enemies/enemyType';
import { FixedStageLayout } from '../scenes/fixedStageLayout';
import { AssetType } from '../assets/assetType';
import { GameEntityType } from '../gameEntityType';
import { StageReward } from '../stages/stageReward';

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
    this.scene.game.sceneManager.changeSceneToFixedStage(
      this.proposedFixedStageLayout as FixedStageLayout,
      this.difficulty,
      this.enemyTypes,
      this.stageReward,
    );
    // console.log('This bed has the following specificites: ');
    // console.log('Difficulty: ' + this.difficulty);
    // console.log('Enemies: ' + this.enemyTypes);
    console.log('Reward: ');
    console.log('     Money reward: ' + this.stageReward.getMoneyReward());
    console.log('     Weapon reward?: ');
    console.log(
      '         Weapon type: ' + this.stageReward.getWeaponReward()?.weaponType,
    );
    console.log('         Rarity: ' + this.stageReward.getWeaponReward()?.rarity);
    // console.log('Is stage procedural: ' + this.isStageProcedural);
    // console.log('Layout: ' + this.proposedFixedStageLayout);
    // console.log('-----------------------------------------');
  }

  override async create(position: Vector3): Promise<void> {
    const entries = await this.scene.game.assetManager.loadAsset('bed', AssetType.OBJECT);
    const bed = entries.rootNodes[0] as Mesh;
    bed.position = position;
    bed.scaling.scaleInPlace(0.13);
    this.scene.pushToMeshes(bed);

    const bedHitbox = bed.getChildMeshes()[2] as Mesh;
    bedHitbox.metadata = this;
    bedHitbox.metadata.isDamageable = false;
    bedHitbox.metadata.isInteractive = true;
    bedHitbox.name = GameEntityType.BED;

    const physicsAggregate = new PhysicsAggregate(bedHitbox, PhysicsShapeType.BOX, {
      mass: 0,
    });
    this.scene.pushToPhysicsAggregates(physicsAggregate);
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
}
