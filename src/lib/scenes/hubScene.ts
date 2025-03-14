import {
  AssetContainer,
  HemisphericLight,
  IPhysicsCollisionEvent,
  Mesh,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsEventType,
  PhysicsShapeType,
  Vector3,
} from '@babylonjs/core';
import { GameScene } from './gameScene';
import { GameEntityType } from '../gameEntityType';
import { AssetType } from '../assetType';
import { FixedStageLayout } from './fixedStageLayout';

export class HubScene extends GameScene {
  // used to store all the assets in the scene for easy disposal
  private assetContainer: AssetContainer = new AssetContainer(this.game.scene);
  private physicsAggregates: PhysicsAggregate[] = [];

  public async load(): Promise<void> {
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;
    this.assetContainer.lights.push(light);

    const ground = MeshBuilder.CreateGround(
      GameEntityType.GROUND,
      { width: 50, height: 50 },
      this.scene,
    );
    this.assetContainer.meshes.push(ground);
    const groundPhysicsAggregate = new PhysicsAggregate(ground, PhysicsShapeType.BOX, {
      mass: 0,
    });
    this.physicsAggregates.push(groundPhysicsAggregate);

    await this.createBed(new Vector3(0, 0, -10));

    this.game.player.resetHealth();
  }

  private async createBed(position: Vector3): Promise<void> {
    const entries = await this.game.assetManager.loadAsset('bed', AssetType.OBJECT);
    const bed = entries.rootNodes[0] as Mesh;
    this.assetContainer.meshes.push(bed);
    const bedHitbox = bed.getChildMeshes()[2] as Mesh;
    bedHitbox.metadata = undefined;
    bedHitbox.name = GameEntityType.BED;
    bed.position = position;
    bed.scaling.scaleInPlace(0.13);
    const physicsAggregate = new PhysicsAggregate(bedHitbox, PhysicsShapeType.BOX, {
      mass: 0,
    });
    this.physicsAggregates.push(physicsAggregate);

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
      this.game.sceneManager.changeSceneToFixedStage(FixedStageLayout.SAMPLESCENE);
      return;
    }
  }

  public async dispose(): Promise<void> {
    this.physicsAggregates.forEach((physicsAggregate) => {
      physicsAggregate.dispose();
    });
    this.physicsAggregates = [];

    this.assetContainer.dispose();
  }
}
