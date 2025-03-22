import {
  AssetContainer,
  InstancedMesh,
  Light,
  Mesh,
  PhysicsAggregate,
  Scene,
} from '@babylonjs/core';
import { Game } from '../game';
import { EnemyFactory } from '../enemies/enemyFactory';
import { EnemyType } from '../enemies/enemyType';
import { FixedStageLayout } from './fixedStageLayout';
import { StageReward } from '../stages/stageReward';

export abstract class GameScene {
  public scene: Scene;
  protected enemyManager!: EnemyFactory;

  public assetContainer!: AssetContainer;
  public physicsAggregates: PhysicsAggregate[] = [];

  // The specificities of the stage linked to this scene

  public isStageProcedural = false;
  // The proposed stage layout, null if procedural
  public proposedFixedStageLayout: FixedStageLayout | null = null;
  public difficultyFactor = 1;
  public enemyTypesToSpawn: EnemyType[] = [];

  public stageReward: StageReward | null = null;

  constructor(public game: Game) {
    this.assetContainer = new AssetContainer(this.game.scene);
    this.scene = game.scene;
    this.enemyManager = EnemyFactory.getInstance();
  }

  public abstract load(): Promise<void>;

  /**
   * Dispose of any resources used by the scene.
   */
  public async dispose(): Promise<void> {
    // Dispose of all physics aggregates
    this.physicsAggregates.forEach((aggregate) => {
      aggregate.dispose();
    });
    this.physicsAggregates = [];

    // Dispose all assets in the asset container
    this.assetContainer.dispose();
  }

  public update(): void {}

  public fixedUpdate(): void {}

  public setStageParameters(difficultyFactor: number, enemyTypes: EnemyType[]): void {
    this.difficultyFactor = difficultyFactor;
    this.enemyTypesToSpawn = enemyTypes;
  }

  public setStageReward(stageReward: StageReward | null): void {
    this.stageReward = stageReward;
  }

  public pushToPhysicsAggregates(physicsAggregate: PhysicsAggregate): void {
    this.physicsAggregates.push(physicsAggregate);
  }

  public pushToMeshes(mesh: Mesh | InstancedMesh): void {
    this.assetContainer.meshes.push(mesh);
  }

  protected pushToLights(light: Light): void {
    this.assetContainer.lights.push(light);
  }
}
