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
import { SceneType } from './sceneType';

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

    //await this.createBed(new Vector3(0, 0, -10));
    this.importScene();
    this.game.player.resetHealth();
  }

  private async importScene(): Promise<void> {
    const entries = await this.game.assetManager.loadAsset('SampleScene', AssetType.SCENE);
    const scene = entries.rootNodes[0] as Mesh;
    this.assetContainer.meshes.push(scene);
    scene.position = new Vector3(0, 0, 0);
    //scene.scaling.scaleInPlace(0.1);
    // apply physics
  
    const scenePhysicsAggregate = new PhysicsAggregate(scene, PhysicsShapeType.BOX, {
      mass: 0,
    });
    this.physicsAggregates.push(scenePhysicsAggregate);
  
    // Iterate through child meshes, log their properties, and apply physics to pillars
    scene.getChildMeshes().forEach((mesh) => {
      console.log(`Mesh Name: ${mesh.name}`);
      console.log(`Mesh ID: ${mesh.id}`);
      console.log(`Mesh Position: ${mesh.position}`);
      console.log(`Mesh Scaling: ${mesh.scaling}`);
      console.log(`Mesh Rotation: ${mesh.rotation}`);
      console.log(`Mesh Metadata: ${JSON.stringify(mesh.metadata)}`);
      console.log('-----------------------------------');
  
      // Apply physics to pillars
      if (mesh.name.includes('Test')) {
        console.log("Pillar found adding physics");
        const pillarPhysicsAggregate = new PhysicsAggregate(mesh, PhysicsShapeType.BOX, {
          mass: 0,
        });
        this.physicsAggregates.push(pillarPhysicsAggregate);
      }
    });
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
      this.game.sceneManager.changeScene(SceneType.EXAMPLE);
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
