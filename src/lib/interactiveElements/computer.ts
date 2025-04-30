import { Mesh, PhysicsAggregate, PhysicsShapeType, Vector3 } from '@babylonjs/core';
import { AssetType } from '../assets/assetType';
import { GameEntityType } from '../gameEntityType';
import { InteractiveElement } from './interactiveElement';
import { UIType } from '../ui/uiType';
import { MetadataFactory } from '../metadata/metadataFactory';
import { SoundCategory } from '../sound/soundSystem';

export class Computer extends InteractiveElement {
  override interact(): void {
    this.gameScene.game.uiManager.displayUI(UIType.COMPUTER);
    this.gameScene.game.soundManager.playSound('pcEnter', SoundCategory.EFFECT);
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
  }
}
