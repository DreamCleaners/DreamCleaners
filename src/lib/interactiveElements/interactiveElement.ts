import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { GameScene } from "../scenes/gameScene";

/** An interactive element, physical and present within the scene */
export abstract class InteractiveElement {
    protected scene !: GameScene;

    constructor(scene: GameScene) {
        this.scene = scene;
    }
    
    // The called function whenever the player tries to interact with the element
    public abstract interact(): void;

    // Creates the interactive element within the scene
    public abstract create(position: Vector3): Promise<void>;
}