import {
  HemisphericLight,
  IPhysicsCollisionEvent,
  Mesh,
  PhysicsAggregate,
  PhysicsEventType,
  PhysicsShapeType,
  Vector3,
} from '@babylonjs/core';
import { GameScene } from './gameScene';
import { GameEntityType } from '../gameEntityType';
import { AssetType } from '../assetType';
import { FixedStageLayout } from './fixedStageLayout';
import { FixedStageScene } from './fixedStageScene';
import { EnemyType } from '../enemies/enemyType';

export class HubScene extends GameScene {

  public async load(): Promise<void> {
    // We use an intermediary scene to avoid having to load the scene from scratch
    const intermediaryScene = new FixedStageScene(this.game, FixedStageLayout.HUB);
    await intermediaryScene.load();
    this.scene = intermediaryScene.scene;
    // We copy all the assets and physics aggregates from the intermediary scene
    this.assetContainer = intermediaryScene.assetContainer;
    this.physicsAggregates = intermediaryScene.physicsAggregates;


    // We will then apply all the specificities of the hub scene
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;
    this.pushToLights(light);

    await this.createBed(new Vector3(0, 0, -10));
  }

  private async createBed(position: Vector3): Promise<void> {
    const entries = await this.game.assetManager.loadAsset('bed', AssetType.OBJECT);
    const bed = entries.rootNodes[0] as Mesh;
    this.pushToMeshes(bed);
    const bedHitbox = bed.getChildMeshes()[2] as Mesh;
    bedHitbox.metadata = undefined;
    bedHitbox.name = GameEntityType.BED;
    bed.position = position;
    bed.scaling.scaleInPlace(0.13);
    const physicsAggregate = new PhysicsAggregate(bedHitbox, PhysicsShapeType.BOX, {
      mass: 0,
    });
    this.pushToPhysicsAggregates(physicsAggregate);

    physicsAggregate.body.setCollisionCallbackEnabled(true);
    const observable = physicsAggregate.body.getCollisionObservable();
    observable.add(this.onCollision.bind(this));
  }

  private onCollision(collisionEvent: IPhysicsCollisionEvent): void {
    const collider = collisionEvent.collider;
    const collidedAgainst = collisionEvent.collidedAgainst;

    if (
      collisionEvent.type === PhysicsEventType.COLLISION_STARTED &&
      collider.transformNode.name === GameEntityType.BED &&
      collidedAgainst.transformNode.name === GameEntityType.PLAYER
    ) {
      this.game.sceneManager.changeSceneToFixedStage(FixedStageLayout.TEST, 1, [
        EnemyType.ZOMBIE,
      ]);
      return;
    }
  }

  
}
