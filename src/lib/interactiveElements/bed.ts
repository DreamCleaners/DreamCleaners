import { Mesh, PhysicsAggregate, PhysicsShapeType, Vector3 } from '@babylonjs/core';
import { InteractiveElement } from './interactiveElement';
import { EnemyType } from '../enemies/enemyType';
import { FixedStageLayout } from '../scenes/fixedStageLayout';
import { AssetType } from '../assets/assetType';
import { GameEntityType } from '../gameEntityType';
import { MetadataFactory } from '../metadata/metadataFactory';

export class Bed extends InteractiveElement {
  // STAGE SELECTION BED
  override interact(): void {
    this.gameScene.game.sceneManager.changeSceneToFixedStage(
      FixedStageLayout.CLOSED_SCENE,
      1,
      [EnemyType.ZOMBIE],
    );
  }

  override async create(position: Vector3): Promise<void> {
    const entries = await this.gameScene.game.assetManager.instantiateAsset(
      'bed',
      AssetType.OBJECT,
    );
    this.mesh = entries.rootNodes[0] as Mesh;
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
    this.gameScene.gameAssetContainer.addPhysicsAggregate(physicsAggregate);
  }

  override dispose(): void {
    this.gameScene.game.assetManager.unloadAsset('bed', AssetType.OBJECT);
  }
}
