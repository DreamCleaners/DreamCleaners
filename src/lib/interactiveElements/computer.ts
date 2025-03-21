import { Mesh, PhysicsAggregate, PhysicsShapeType, Vector3 } from '@babylonjs/core';
import { AssetType } from '../assets/assetType';
import { GameEntityType } from '../gameEntityType';
import { InteractiveElement } from './interactiveElement';
import { UIType } from '../ui/uiType';
import { MetadataFactory } from '../metadata/metadataFactory';

export class Computer extends InteractiveElement {
  override interact(): void {
    this.gameScene.game.uiManager.displayUI(UIType.PLAYER_UPGRADES);
  }

  override async create(position: Vector3): Promise<void> {
    const entries = await this.gameScene.game.assetManager.instantiateAsset(
      'scifi_pc',
      AssetType.OBJECT,
    );
    this.mesh = entries.rootNodes[0] as Mesh;
    this.mesh.position = position;
    this.mesh.scaling.scaleInPlace(2);

    const pcHitbox = this.mesh.getChildMeshes()[2] as Mesh;

    pcHitbox.metadata = MetadataFactory.createMetadataObject<InteractiveElement>(this, {
      isInteractive: true,
    });

    pcHitbox.name = GameEntityType.PC;
    const physicsAggregate = new PhysicsAggregate(pcHitbox, PhysicsShapeType.BOX, {
      mass: 0,
    });
    this.gameScene.gameAssetContainer.addPhysicsAggregate(physicsAggregate);
  }

  override dispose(): void {
    this.gameScene.game.assetManager.unloadAsset('scifi_pc', AssetType.OBJECT);
  }
}
