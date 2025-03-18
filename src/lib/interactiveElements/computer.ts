import { Mesh, PhysicsAggregate, PhysicsShapeType, Vector3 } from '@babylonjs/core';
import { AssetType } from '../assets/assetType';
import { GameEntityType } from '../gameEntityType';
import { InteractiveElement } from './interactiveElement';
import { UIType } from '../ui/uiType';

export class Computer extends InteractiveElement {
  override interact(): void {
    this.scene.game.uiManager.displayUI(UIType.PLAYER_UPGRADES);
  }

  override async create(position: Vector3): Promise<void> {
    const entries = await this.scene.game.assetManager.loadAsset(
      'scifi_pc',
      AssetType.OBJECT,
    );
    const pc = entries.rootNodes[0] as Mesh;
    pc.position = position;
    pc.scaling.scaleInPlace(2);
    this.scene.pushToMeshes(pc);

    const pcHitbox = pc.getChildMeshes()[2] as Mesh;

    pcHitbox.metadata = this;
    pcHitbox.metadata.isDamageable = false;
    pcHitbox.metadata.isInteractive = true;

    pcHitbox.name = GameEntityType.PC;
    const physicsAggregate = new PhysicsAggregate(pcHitbox, PhysicsShapeType.BOX, {
      mass: 0,
    });
    this.scene.pushToPhysicsAggregates(physicsAggregate);
  }
}
