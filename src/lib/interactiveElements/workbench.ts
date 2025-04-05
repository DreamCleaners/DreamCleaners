import { Mesh, PhysicsAggregate, PhysicsShapeType, Vector3 } from "@babylonjs/core";
import { InteractiveElement } from "./interactiveElement";
import { UIType } from "../ui/uiType";
import { AssetType } from "../assets/assetType";
import { MetadataFactory } from "../metadata/metadataFactory";
import { GameEntityType } from "../gameEntityType";

export class Workbench extends InteractiveElement{
    
    override interact(): void {
        this.gameScene.game.uiManager.displayUI(UIType.WORKBENCH);
      }
    
      override async create(position: Vector3): Promise<void> {
        this.gameAssetContainer =
          await this.gameScene.game.assetManager.loadGameAssetContainer(
            'workbench',
            AssetType.OBJECT,
          );
    
        this.mesh = this.gameAssetContainer.addAssetsToScene();
        this.mesh.position = position;

        const workbenchHitbox = this.mesh.getChildMeshes()[0] as Mesh;

        // We make that mesh invisible because it is laggy, we instead render the
        // workbench mesh present in the unity scene
        workbenchHitbox.isVisible = false;
    
        workbenchHitbox.metadata = MetadataFactory.createMetadataObject<InteractiveElement>(this, {
          isInteractive: true,
        });
    
        workbenchHitbox.name = GameEntityType.WORKBENCH;
        const physicsAggregate = new PhysicsAggregate(workbenchHitbox, PhysicsShapeType.BOX, {
          mass: 0,
        });
        this.gameAssetContainer.addPhysicsAggregate(physicsAggregate);
      }
}