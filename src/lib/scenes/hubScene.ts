import {
  HemisphericLight,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  Vector3,
} from '@babylonjs/core';
import { GameScene } from './gameScene';
import { FixedStageLayout } from './fixedStageLayout';
import { FixedStageScene } from './fixedStageScene';
import { Bed } from '../interactiveElements/bed';
import { Computer } from '../interactiveElements/computer';
import { GameEntityType } from '../gameEntityType';

export class HubScene extends GameScene {
  public async load(): Promise<void> {
    // We use an intermediary scene to avoid having to load the scene from scratch
    const intermediaryScene = new FixedStageScene(this.game, FixedStageLayout.HUB);
    await intermediaryScene.load();
    this.scene = intermediaryScene.scene;
    // We copy all the assets and physics aggregates from the intermediary scene
    this.assetContainer = intermediaryScene.assetContainer;
    this.physicsAggregates = intermediaryScene.physicsAggregates;

    this.initGround();

    // We will then apply all the specificities of the hub scene
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;
    this.pushToLights(light);

    const bed = new Bed(this);
    await bed.create(new Vector3(0, 0, -10));

    const computer = new Computer(this);
    await computer.create(new Vector3(0, 1, 10));

    this.game.moneyManager.convertScoreToMoney(this.game.scoreManager.getScore());
    this.game.scoreManager.reset();

    this.game.player.resetHealth();

    this.game.saveManager.save();
  }

  private initGround(): void {
    const ground = MeshBuilder.CreateGround(
      GameEntityType.GROUND,
      { width: 50, height: 50 },
      this.scene,
    );
    this.pushToMeshes(ground);
    const groundPhysicsAggregate = new PhysicsAggregate(ground, PhysicsShapeType.BOX, {
      mass: 0,
    });
    this.pushToPhysicsAggregates(groundPhysicsAggregate);
  }
}
