import {
  Color3,
  ICrowd,
  INavMeshParameters,
  Mesh,
  RecastJSPlugin,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RecastInjection = any;

export class NavigationManager {
  private navigationPlugin: RecastJSPlugin;
  public crowd!: ICrowd;

  private readonly MAX_AGENT_RADIUS = 0.5;
  private agentCount = 0;

  private lastValidDestinationPoint: Vector3 = Vector3.Zero();

  constructor(
    recastInjection: RecastInjection,
    private scene: Scene,
    agentCount: number,
  ) {
    this.navigationPlugin = new RecastJSPlugin(recastInjection);
    this.agentCount = agentCount;
  }

  public createNavmesh(
    meshes: Mesh[],
    parameters: INavMeshParameters,
    displayDebugMesh: boolean = false,
  ): void {
    console.log("Creating navmesh for ", meshes.length, " meshes");
    this.navigationPlugin.createNavMesh(meshes, parameters);

    this.crowd = this.navigationPlugin.createCrowd(
      this.agentCount,
      this.MAX_AGENT_RADIUS,
      this.scene,
    );

    if (displayDebugMesh) {
      const navmeshdebug = this.navigationPlugin.createDebugNavMesh(this.scene);
      const matdebug = new StandardMaterial('matdebug', this.scene);
      matdebug.diffuseColor = new Color3(0.1, 0.2, 1);
      matdebug.alpha = 0.2;
      navmeshdebug.material = matdebug;
    }
  }

  public dispose(): void {
    this.navigationPlugin.dispose();
  }

  public moveAgentTo(agentIndex: number, destination: Vector3): void {
    const point = this.navigationPlugin.getClosestPoint(destination);

    if (!point.equals(Vector3.Zero())) {
      this.lastValidDestinationPoint = point;
    }

    this.crowd.agentGoto(agentIndex, this.lastValidDestinationPoint);
  }
}
