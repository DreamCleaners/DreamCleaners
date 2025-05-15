import {
  Mesh,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  Scene,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import { GameEntityType } from '../gameEntityType';
import { MetadataFactory } from '../metadata/metadataFactory';
import { ColliderMask } from '../colliderMask';

export class SpawnTrigger {
  private physicsAggregate!: PhysicsAggregate;
  private triggerMesh!: Mesh;

  constructor(
    private scene: Scene,
    diameter: number,
    position: Vector3,
    public spawnPoints: TransformNode[],
  ) {
    this.triggerMesh = MeshBuilder.CreateSphere(
      GameEntityType.SPAWN_TRIGGER,
      { diameter: diameter },
      this.scene,
    );
    this.triggerMesh.position = position;
    this.triggerMesh.metadata = MetadataFactory.createMetadataObject<SpawnTrigger>(
      this,
      {},
    );
    this.triggerMesh.isVisible = false;

    this.physicsAggregate = new PhysicsAggregate(
      this.triggerMesh,
      PhysicsShapeType.SPHERE,
      { mass: 0 },
      this.scene,
    );
    this.physicsAggregate.shape.isTrigger = true;
    this.physicsAggregate.shape.filterMembershipMask = ColliderMask.OBJECT;
  }

  public dispose(): void {
    this.physicsAggregate.dispose();
    this.triggerMesh.dispose();
  }
}
