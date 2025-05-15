import {
  Color3,
  Color4,
  FragmentOutputBlock,
  IBasePhysicsCollisionEvent,
  InputBlock,
  LengthBlock,
  LerpBlock,
  Mesh,
  MeshBuilder,
  NodeMaterial,
  NodeMaterialModes,
  NodeMaterialSystemValues,
  Observer,
  ParticleSystem,
  PhysicsAggregate,
  PhysicsEventType,
  PhysicsShapeType,
  SubtractBlock,
  TransformBlock,
  Vector2,
  Vector3,
  VertexOutputBlock,
} from '@babylonjs/core';
import { Game } from '../game';
import { GameEntityType } from '../gameEntityType';
import { Enemy } from './enemy';
import { ColliderMask } from '../colliderMask';

export class FireBall {
  private mesh!: Mesh;
  private physicsAggregate!: PhysicsAggregate;
  private onCollisionObserver!: Observer<IBasePhysicsCollisionEvent>;

  private particleSystem!: ParticleSystem;

  private readonly SPEED = 14;
  private readonly LIFETIME = 2; // seconds

  constructor(
    private game: Game,
    private enemy: Enemy,
    private position: Vector3,
    private target: Vector3,
  ) {
    this.init();
  }

  private init(): void {
    const id = Math.floor(Math.random() * 1000000);
    this.mesh = MeshBuilder.CreateSphere(
      `fireball${id}`,
      { diameter: 0.4 },
      this.game.scene,
    );
    this.mesh.name = GameEntityType.PROJECTILE;
    this.mesh.position = this.position;
    this.mesh.material = this.getMaterial();
    this.game.glowLayer.addIncludedOnlyMesh(this.mesh);

    // physics
    this.physicsAggregate = new PhysicsAggregate(
      this.mesh,
      PhysicsShapeType.SPHERE,
      {
        mass: 1,
      },
      this.game.scene,
    );
    this.physicsAggregate.body.setMassProperties({ inertia: new Vector3(0, 0, 0) });

    // disablePreStep to false so we can rotate the mesh without affecting the physics body
    this.physicsAggregate.body.disablePreStep = false;
    this.physicsAggregate.shape.isTrigger = true;
    this.physicsAggregate.shape.filterMembershipMask = ColliderMask.OBJECT;
    const observer = this.game.physicsPlugin.onTriggerCollisionObservable;
    this.onCollisionObserver = observer.add(this.onCollision.bind(this));

    // start fireball movement
    const direction = this.target.subtract(this.position).normalize();
    this.physicsAggregate.body.setLinearVelocity(direction.scale(this.SPEED));

    this.playVFX();

    setTimeout(() => {
      this.dispose();
    }, this.LIFETIME * 1000);
  }

  /**
   * Warning: this function is called for every trigger collision because it's a global observable
   * So we need to check the fireball id and the collider id to know if it's the right one
   */
  private onCollision(event: IBasePhysicsCollisionEvent): void {
    const collider = event.collider;
    const collidedAgainst = event.collidedAgainst;

    if (event.type !== PhysicsEventType.TRIGGER_ENTERED) return;

    if (
      collider.transformNode.name === GameEntityType.PLAYER &&
      collidedAgainst.transformNode.name === GameEntityType.PROJECTILE &&
      collidedAgainst.transformNode.id === this.mesh.id
    ) {
      this.enemy.applyDamageToPlayer();
      this.dispose();
    } else if (
      collider.transformNode.name === GameEntityType.PROJECTILE &&
      collidedAgainst.transformNode.name !== GameEntityType.ENEMY &&
      collider.transformNode.id === this.mesh.id
    ) {
      this.dispose();
    }
  }

  private dispose(): void {
    this.game.glowLayer.removeIncludedOnlyMesh(this.mesh);
    this.stopVFX();
    this.onCollisionObserver.remove();
    this.physicsAggregate.dispose();
    this.mesh.dispose();
  }

  private getMaterial(): NodeMaterial {
    const nodeMaterial = new NodeMaterial('node');
    nodeMaterial.mode = NodeMaterialModes.Material;

    const position = new InputBlock('position');
    position.visibleInInspector = false;
    position.visibleOnFrame = false;
    position.target = 1;
    position.setAsAttribute('position');

    const WorldPos = new TransformBlock('WorldPos');
    WorldPos.visibleInInspector = false;
    WorldPos.visibleOnFrame = false;
    WorldPos.target = 1;
    WorldPos.complementZ = 0;
    WorldPos.complementW = 1;

    const World = new InputBlock('World');
    World.visibleInInspector = false;
    World.visibleOnFrame = false;
    World.target = 1;
    World.setAsSystemValue(NodeMaterialSystemValues.World);

    const WorldPosViewProjectionTransform = new TransformBlock(
      'WorldPos * ViewProjectionTransform',
    );
    WorldPosViewProjectionTransform.visibleInInspector = false;
    WorldPosViewProjectionTransform.visibleOnFrame = false;
    WorldPosViewProjectionTransform.target = 1;
    WorldPosViewProjectionTransform.complementZ = 0;
    WorldPosViewProjectionTransform.complementW = 1;

    const ViewProjection = new InputBlock('ViewProjection');
    ViewProjection.visibleInInspector = false;
    ViewProjection.visibleOnFrame = false;
    ViewProjection.target = 1;
    ViewProjection.setAsSystemValue(NodeMaterialSystemValues.ViewProjection);

    const VertexOutput = new VertexOutputBlock('VertexOutput');
    VertexOutput.visibleInInspector = false;
    VertexOutput.visibleOnFrame = false;
    VertexOutput.target = 1;

    const Orange = new InputBlock('Orange');
    Orange.visibleInInspector = false;
    Orange.visibleOnFrame = false;
    Orange.target = 1;
    Orange.value = new Color3(1, 0.2980392156862745, 0);
    Orange.isConstant = false;

    const Lerp = new LerpBlock('Lerp');
    Lerp.visibleInInspector = false;
    Lerp.visibleOnFrame = false;
    Lerp.target = 4;

    const Yellow = new InputBlock('Yellow');
    Yellow.visibleInInspector = false;
    Yellow.visibleOnFrame = false;
    Yellow.target = 1;
    Yellow.value = new Color3(1, 1, 0);
    Yellow.isConstant = false;

    const FragmentOutput = new FragmentOutputBlock('FragmentOutput');
    FragmentOutput.visibleInInspector = false;
    FragmentOutput.visibleOnFrame = false;
    FragmentOutput.target = 2;
    FragmentOutput.convertToGammaSpace = false;
    FragmentOutput.convertToLinearSpace = false;
    FragmentOutput.useLogarithmicDepth = false;

    const Length = new LengthBlock('Length');
    Length.visibleInInspector = false;
    Length.visibleOnFrame = false;
    Length.target = 4;

    const Subtract = new SubtractBlock('Subtract');
    Subtract.visibleInInspector = false;
    Subtract.visibleOnFrame = false;
    Subtract.target = 4;

    const uv = new InputBlock('uv');
    uv.visibleInInspector = false;
    uv.visibleOnFrame = false;
    uv.target = 1;
    uv.setAsAttribute('uv');

    const Center = new InputBlock('Center');
    Center.visibleInInspector = false;
    Center.visibleOnFrame = false;
    Center.target = 1;
    Center.value = new Vector2(0.5, 0.5);
    Center.isConstant = true;

    // connections
    position.output.connectTo(WorldPos.vector);
    World.output.connectTo(WorldPos.transform);
    WorldPos.output.connectTo(WorldPosViewProjectionTransform.vector);
    ViewProjection.output.connectTo(WorldPosViewProjectionTransform.transform);
    WorldPosViewProjectionTransform.output.connectTo(VertexOutput.vector);
    Orange.output.connectTo(Lerp.left);
    Yellow.output.connectTo(Lerp.right);
    uv.output.connectTo(Subtract.left);
    Center.output.connectTo(Subtract.right);
    Subtract.output.connectTo(Length.value);
    Length.output.connectTo(Lerp.gradient);
    Lerp.output.connectTo(FragmentOutput.rgb);

    nodeMaterial.addOutputNode(VertexOutput);
    nodeMaterial.addOutputNode(FragmentOutput);
    nodeMaterial.build();

    // eslint-disable-next-line
    // @ts-ignore
    nodeMaterial.emissiveColor = Color3.Red();

    return nodeMaterial;
  }

  private playVFX(): void {
    this.particleSystem = new ParticleSystem('fireParticle', 100, this.game.scene);
    this.particleSystem.particleTexture = this.game.assetManager.getTexture('smoke');

    this.particleSystem.emitter = this.mesh;
    this.particleSystem.minEmitBox = Vector3.Zero();
    this.particleSystem.maxEmitBox = Vector3.Zero();

    const reverseDirection = this.position.subtract(this.target).normalize();
    const range = 0.5;
    this.particleSystem.direction1 = reverseDirection
      .scale(2)
      .addInPlaceFromFloats(range, range, range);
    this.particleSystem.direction2 = reverseDirection
      .scale(2)
      .addInPlaceFromFloats(-range, -range, -range);

    this.particleSystem.emitRate = 50;
    this.particleSystem.updateSpeed = 0.01;

    this.particleSystem.minLifeTime = 0.2;
    this.particleSystem.maxLifeTime = 1;

    this.particleSystem.addColorGradient(0, new Color4(0, 0, 0, 1));
    this.particleSystem.addColorGradient(0.5, new Color4(0.1, 0.1, 0.1, 1));
    this.particleSystem.addColorGradient(1, new Color4(0, 0, 0, 1));

    this.particleSystem.minSize = 0.1;
    this.particleSystem.maxSize = 0.3;

    this.particleSystem.isLocal = true;

    this.particleSystem.start();
  }

  private stopVFX(): void {
    if (this.particleSystem) {
      this.particleSystem.stop();
      this.particleSystem.dispose();
    }
  }
}
