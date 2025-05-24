import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { GameScene } from '../scenes/gameScene';
import { Mesh } from '@babylonjs/core';
import { GameAssetContainer } from '../assets/gameAssetContainer';

/** An interactive element, physical and present within the scene */
export abstract class InteractiveElement {
  public mesh!: Mesh;
  protected gameAssetContainer!: GameAssetContainer;

  constructor(public gameScene: GameScene) {}

  // The called function whenever the player tries to interact with the element
  public abstract interact(): void;

  // Creates the interactive element within the scene
  public abstract create(position: Vector3): Promise<void>;

  public dispose(): void {
    this.gameAssetContainer.dispose();
  }
}
