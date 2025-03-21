import { Mesh, PhysicsAggregate, PhysicsShapeType, Vector3 } from '@babylonjs/core';
import { InteractiveElement } from './interactiveElement';
import { EnemyType } from '../enemies/enemyType';
import { FixedStageLayout } from '../scenes/fixedStageLayout';
import { AssetType } from '../assets/assetType';
import { GameEntityType } from '../gameEntityType';

export class Bed extends InteractiveElement {
  // STAGE SELECTION BED
  override interact(): void {
    this.scene.game.sceneManager.changeSceneToFixedStage(FixedStageLayout.TEST, 1, [
      EnemyType.ZOMBIE,
    ]);
  }

  override async create(position: Vector3): Promise<void> {
    const entries = await this.scene.game.assetManager.instantiateAsset(
      'bed',
      AssetType.OBJECT,
    );
    const bed = entries.rootNodes[0] as Mesh;
    bed.position = position;
    bed.scaling.scaleInPlace(0.13);

    const bedHitbox = bed.getChildMeshes()[2] as Mesh;
    bedHitbox.metadata = this;
    bedHitbox.metadata.isDamageable = false;
    bedHitbox.metadata.isInteractive = true;
    bedHitbox.name = GameEntityType.BED;

    const physicsAggregate = new PhysicsAggregate(bedHitbox, PhysicsShapeType.BOX, {
      mass: 0,
    });
    this.scene.gameAssetContainer.addPhysicsAggregate(physicsAggregate);
  }

  override dispose(): void {
    this.scene.game.assetManager.unloadAsset('bed', AssetType.OBJECT);
  }
}
