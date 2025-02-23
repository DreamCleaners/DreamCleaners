import {
  HemisphericLight,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  Scene,
  Vector3,
} from '@babylonjs/core';
import { Game } from './game';
import { Zombie } from './zombie';
import { GameEntityType } from './gameEntityType';

export class GameScene {
  public isLoaded = false;
  private scene: Scene;
  private zombies: Zombie[] = [];

  constructor(private game: Game) {
    this.scene = game.scene;
  }

  public async load(): Promise<void> {
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;

    const ground = MeshBuilder.CreateGround(
      GameEntityType.GROUND,
      { width: 50, height: 50 },
      this.scene,
    );
    new PhysicsAggregate(ground, PhysicsShapeType.BOX, {
      mass: 0,
    });

    for (let i = 0; i < 10; i++) {
      const zombie = new Zombie(this.game);
      await zombie.init(new Vector3(Math.random() * 0.15, 0, Math.random() * 0.15));
      this.zombies.push(zombie);
    }

    this.isLoaded = true;
  }

  public update(): void {
    this.zombies.forEach((zombie) => {
      zombie.update();
    });
  }
}
