import { Mesh, PhysicsAggregate, PhysicsShapeType, Vector3 } from '@babylonjs/core';
import { AssetType } from '../assets/assetType';
import { GameEntityType } from '../gameEntityType';
import { InteractiveElement } from './interactiveElement';
import { UIType } from '../ui/uiType';
import { MetadataFactory } from '../metadata/metadataFactory';

export class Computer extends InteractiveElement {
  override interact(): void {
    this.gameScene.game.uiManager.displayUI(UIType.COMPUTER);
  }

  override async create(position: Vector3): Promise<void> {
    this.gameAssetContainer =
      await this.gameScene.game.assetManager.loadGameAssetContainer(
        'computer',
        AssetType.OBJECT,
      );

    this.mesh = this.gameAssetContainer.addAssetsToScene();
    this.mesh.position = position;

    const pcHitbox = this.mesh.getChildMeshes()[0] as Mesh;

    pcHitbox.metadata = MetadataFactory.createMetadataObject<InteractiveElement>(this, {
      isInteractive: true,
    });

    pcHitbox.name = GameEntityType.PC;
    const physicsAggregate = new PhysicsAggregate(pcHitbox, PhysicsShapeType.BOX, {
      mass: 0,
    });
    this.gameAssetContainer.addPhysicsAggregate(physicsAggregate);

    // Also add a "music" for ambiance
    this.gameScene.game.soundManager.playSpatialSoundAt(
      'placeholder',
      new Vector3(1.5, 1.5, 1.5),
    );
  }
}
