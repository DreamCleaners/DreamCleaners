import {
  AssetContainer,
  HemisphericLight,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  Vector3,
} from '@babylonjs/core';
import { GameScene } from './gameScene';
import { Zombie } from '../zombie';
import { GameEntityType } from '../gameEntityType';
import { SceneType } from './sceneType';

export class ExampleScene extends GameScene {
  // used to store all the assets in the scene for easy disposal
  private assetContainer: AssetContainer = new AssetContainer(this.game.scene);
  private physicsAggregates: PhysicsAggregate[] = [];

  private zombies: Zombie[] = [];
  private zombieCount = 0;

  public async load(): Promise<void> {
    this.game.scoreManager.reset();
    this.game.player.onDamageTakenObservable.add(
      this.game.scoreManager.onPlayerDamageTaken.bind(this.game.scoreManager),
    );

    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;
    this.assetContainer.lights.push(light);

    const ground = MeshBuilder.CreateGround(
      GameEntityType.GROUND,
      { width: 50, height: 50 },
      this.scene,
    );
    this.assetContainer.meshes.push(ground);
    const groundPhysicsAggregate = new PhysicsAggregate(ground, PhysicsShapeType.BOX, {
      mass: 0,
    });
    this.physicsAggregates.push(groundPhysicsAggregate);

    for (let i = 0; i < 2; i++) {
      const zombie = new Zombie(this.game);
      await zombie.init(new Vector3(Math.random() * 0.15, 0, Math.random() * 0.15));
      zombie.onDeathObservable.add(this.onZombieDeath.bind(this));
      this.zombies.push(zombie);
      this.zombieCount++;
    }
  }

  public update(): void {
    this.zombies.forEach((zombie) => {
      zombie.update();
    });
  }

  public fixedUpdate(): void {
    this.zombies.forEach((zombie) => {
      zombie.fixedUpdate();
    });
  }

  public async dispose(): Promise<void> {
    this.zombies.forEach((zombie) => {
      zombie.dispose();
    });
    this.zombies = [];

    this.physicsAggregates.forEach((physicsAggregate) => {
      physicsAggregate.dispose();
    });
    this.physicsAggregates = [];

    this.assetContainer.dispose();
  }

  private onZombieDeath(): void {
    this.game.scoreManager.onEnemyDeath();

    this.zombieCount--;
    if (this.zombieCount === 0) {
      this.game.scoreManager.endStage();
      this.game.sceneManager.changeScene(SceneType.HUB);
    }
  }
}
