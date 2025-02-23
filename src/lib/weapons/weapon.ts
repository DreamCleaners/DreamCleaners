import { WeaponRarity } from './weaponRarity';
import { WeaponStatistic } from './weaponStatistic';
import { StaticWeaponStatistic } from './staticWeaponStatistic';
import { Player } from '../player';
import {
  AbstractMesh,
  Mesh,
  MeshBuilder,
  PhysicsEngineV2,
  PhysicsRaycastResult,
  Vector3,
} from '@babylonjs/core';
import { AssetType } from '../assetType';
import { IDamageable } from '../damageable';

export class Weapon {
  private mesh!: AbstractMesh;
  private player!: Player;
  public weaponName!: string;
  public currentRarity!: WeaponRarity;
  private raycastResult: PhysicsRaycastResult = new PhysicsRaycastResult();
  private physicsEngine!: PhysicsEngineV2;

  // Array containing all non static stats for the weapon, for every rarity tier
  private globalStats!: Map<WeaponStatistic, Array<number>>;

  // Array containing the current stats for the weapon, for the current rarity tier, for easier access
  private currentStats!: Map<WeaponStatistic, number>;

  private staticStats!: Map<StaticWeaponStatistic, number>;

  constructor(player: Player, name: string, rarity: WeaponRarity) {
    this.player = player;
    this.currentRarity = rarity;
    this.weaponName = name;
    this.physicsEngine = player.game.scene.getPhysicsEngine() as PhysicsEngineV2;
    this.initArrays();
    this.loadStatsFromJSON();
    this.initMesh();
  }

  // ----------------- Container related (babylon) -----------------
  // ---------------------------------------------------------------

  private async initMesh(): Promise<void> {
    const entries = await this.player.game.assetManager.loadAsset(
      this.weaponName,
      AssetType.WEAPON,
    );
    this.mesh = entries.rootNodes[0] as Mesh;
    this.mesh.parent = this.player.camera;
    this.mesh.position.addInPlace(new Vector3(0.5, -0.4, 1.5));
    this.mesh.rotation.z = Math.PI;
    this.mesh.scaling = new Vector3(0.15, 0.15, 0.15);
  }

  public hideInScene(): void {
    this.mesh.setEnabled(false);
  }

  public showInScene(): void {
    this.mesh.setEnabled(true);
  }

  // --------------------- Stats related ---------------------------
  // ---------------------------------------------------------------

  private initArrays(): void {
    this.globalStats = new Map<WeaponStatistic, Array<number>>();
    this.currentStats = new Map<WeaponStatistic, number>();
    this.staticStats = new Map<StaticWeaponStatistic, number>();
  }

  /** Parses JSON of the weapon stats and load it into class' arrays fields */
  private async loadStatsFromJSON(): Promise<void> {
    const name = this.weaponName.toLowerCase();
    try {
      const response = await fetch(`/data/stats/${name}.json`);
      if (!response.ok) {
        throw new Error(`Weapon stats for ${this.weaponName} not found`);
      }
      const data = await response.json();

      // Load global stats
      for (const [key, values] of Object.entries(data.globalStats)) {
        this.globalStats.set(
          WeaponStatistic[key as keyof typeof WeaponStatistic],
          values as Array<number>,
        );
      }

      // Load static stats
      for (const [key, value] of Object.entries(data.staticStats)) {
        this.staticStats.set(
          StaticWeaponStatistic[key as keyof typeof StaticWeaponStatistic],
          value as number,
        );
      }
    } catch (error) {
      console.error(`Could not load stats from JSON for weapon of name ${this.weaponName},
                 error trace: ${error}`);
    }

    this.applyCurrentStats();
  }

  /** Based on the current item's rarity we update its currentStats array */
  private applyCurrentStats(): void {
    if (this.globalStats.size === 0) {
      console.error('Global stats not loaded, cannot apply current stats');
      return;
    }

    for (const [key, value] of this.globalStats) {
      this.currentStats.set(key, value[this.currentRarity]);
    }
  }

  /** Returns the current value of the weapon given stat */
  public getStat(stat: WeaponStatistic): number {
    const ret = this.currentStats.get(stat);
    if (ret === undefined) {
      console.error(`Stat ${stat} not found for weapon ${this.weaponName}`);
      return -1;
    }
    return ret;
  }

  // --------------------- Shooting related ---------------------------
  // ---------------------------------------------------------------

  /** Handles primary fire for the weapon */
  public handlePrimaryFire(): void {
    // testing raycast
    const start = this.player.camera.globalPosition.clone();
    const direction = this.player.camera.getForwardRay().direction;
    const end = start.add(direction.scale(this.getStat(WeaponStatistic.RANGE)));

    this.physicsEngine.raycastToRef(start, end, this.raycastResult);

    if (this.raycastResult.hasHit && this.raycastResult.body?.transformNode.metadata) {
      console.log('Hit entity');
      const damageableEntity = this.raycastResult.body?.transformNode
        .metadata as IDamageable;
      damageableEntity.takeDamage(this.getStat(WeaponStatistic.DAMAGE));
    }

    // Debug shooting line
    const line = MeshBuilder.CreateLines(
      'lines',
      { points: [this.mesh.absolutePosition, end] },
      this.player.game.scene,
    );

    setTimeout(() => {
      line.dispose();
    }, 50);
  }
}
