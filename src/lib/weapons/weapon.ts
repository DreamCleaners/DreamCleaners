import { WeaponRarity } from './weaponRarity';
import { WeaponStatistic } from './weaponStatistic';
import { StaticWeaponStatistic } from './staticWeaponStatistic';
import { Player } from '../player';
import { AssetManager } from '../assetManager';
import { AbstractMesh, Color3, Matrix, MeshBuilder, Quaternion, StandardMaterial, Vector3 } from '@babylonjs/core';
import { AssetType } from '../assetType';

export class Weapon {
  private mesh!: AbstractMesh;

  private player!: Player;

  public weaponName!: string;

  public currentRarity!: WeaponRarity;

  private globalStats!: Map<WeaponStatistic, Array<number>>;
  // Array containing all non static stats for the weapon, for every rarity tier

  private currentStats!: Map<WeaponStatistic, number>;
  // Array containing the current stats for the weapon, for the current rarity tier, for easier access

  private staticStats!: Map<StaticWeaponStatistic, number>;

  private lastWeaponFire = 0;


  constructor(player: Player, name: string, rarity: WeaponRarity) {
    this.player = player;
    this.currentRarity = rarity;
    this.weaponName = name;
    this.initArrays();
    this.loadStatsFromJSON();
    this.initContainer();

    // TO SATISFY THE FREAKING LEFTHOOK
    console.log(
      'Initiated weapon: ' +
        this.weaponName +
        ' of rarity: ' +
        WeaponRarity[this.currentRarity],
      +' game: ' + String(this.player),
    );
  }

  // ----------------- Container related (babylon) -----------------
  // ---------------------------------------------------------------

  private async initContainer(): Promise<void> {
    const container = await AssetManager.loadAsset(
      AssetType.WEAPON,
      this.weaponName,
      this.player.game.scene,
    );
    container.addAllToScene();
    this.mesh = container.meshes[0];
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
    console.log('Loading stats from JSON for weapon: ' + name);
    try {
      const response = await fetch(`/weapons/stats/${name}.json`);
      if (!response.ok) {
        throw new Error(`Weapon stats for ${this.weaponName} not found`);
      } else console.log('Stats found for weapon: ' + this.weaponName);
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

    console.log('Get damage: ' + this.getStat(WeaponStatistic.DAMAGE));
  }

  /** Based on the current item's rarity we update its currentStats array */
  private applyCurrentStats(): void {
    if (this.globalStats.size === 0) {
      console.error('Global stats not loaded, cannot apply current stats');
      return;
    }

    for (const [key, value] of this.globalStats) {
      this.currentStats.set(key, value[this.currentRarity]);
      console.log(
        'Current stat for ' + WeaponStatistic[key] + ' is: ' + this.currentStats.get(key),
      );
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

  /** Handles primary fire for the weapon.
   * Builds the projectiles and shoots them based on the weapon's static stats
   * that describe the weapon's overall behaviour
  */
  public handlePrimaryFire(): void {
    const currentTime = Date.now();
    const cadency = this.getStat(WeaponStatistic.CADENCY) * 1000;

    if (!(currentTime - this.lastWeaponFire >= cadency)) {
      return;
    }

    console.log("Entering handlePrimaryFire, able to shoot");

    this.lastWeaponFire = currentTime;

    const isBurst = this.staticStats.get(StaticWeaponStatistic.IS_BURST) || false;
    const bulletsPerBurst = this.staticStats.get(StaticWeaponStatistic.BULLETS_PER_BURST) || 1;
    const bulletsPerShot = this.staticStats.get(StaticWeaponStatistic.BULLETS_PER_SHOT) || 1;
    const projectionCone = this.staticStats.get(StaticWeaponStatistic.PROJECTION_CONE) || 0;

    if (isBurst) {
      const delayBetweenShotsInBurst = this.staticStats.get(StaticWeaponStatistic.DELAY_BETWEEN_SHOTS_IN_BURST) || 0;

      for (let i = 0; i < bulletsPerBurst; i++) {
        setTimeout(() => {
          this.shootBullets(bulletsPerShot, projectionCone);
        }, i * delayBetweenShotsInBurst * 1000); // We space each bullet of the burst by a delay
      }
    } else {
      this.shootBullets(bulletsPerShot, projectionCone);
    }

    console.log('Leaving handlePrimaryFire');
  }

  /** Calls performRaycast 'bulletsPerShot' times. Calculates a direction for each bullet
   * depending on the projection cone of the weapon (The most obvious example is the shotgun)
   */
  private shootBullets(bulletsPerShot: number, projectionCone: number): void {
    if(projectionCone === 0) {
      // Not a "cone" weapon, just shoot straight in the direction of the camera
      for (let i = 0; i < bulletsPerShot; i++) {
        this.performRaycast(this.player.camera.getForwardRay().direction);
      }
    }
    else{
      // Based on the projection cone, we must determine a direction for each bullet (raycast)
      for (let i = 0; i < bulletsPerShot; i++) {
        const direction = this.calculateRandomDirection(projectionCone);
        this.performRaycast(direction);
      }
    }
  }

  /** Calculates a random direction within the projection cone */
  private calculateRandomDirection(projectionCone: number): Vector3 {
    const forward = this.player.camera.getForwardRay().direction;

    // Random angles within the cone for both X and Y directions
    const angleX = (Math.random() - 0.5) * projectionCone;
    const angleY = (Math.random() - 0.5) * projectionCone;

    // Rotation around the Y axis
    const quaternionY = Quaternion.RotationAxis(Vector3.Up(), angleY);
    const rotationMatrixY = new Matrix();
    quaternionY.toRotationMatrix(rotationMatrixY);
    let direction = Vector3.TransformCoordinates(forward, rotationMatrixY).normalize();

    // Rotation around the X axis
    const right = Vector3.Cross(Vector3.Up(), direction).normalize();
    const quaternionX = Quaternion.RotationAxis(right, angleX);
    const rotationMatrixX = new Matrix();
    quaternionX.toRotationMatrix(rotationMatrixX);
    direction = Vector3.TransformCoordinates(direction, rotationMatrixX).normalize();

    return direction;
  }

  /** Performs a raycast and visualizes it with a tube */
  private performRaycast(direction: Vector3): void {
    console.log('Shooting raycast !');

    // DEBUG RAYCAST, FINAL IMPLEMENTATION WITH PHYSICS SHALL DIFFER

    const origin = this.player.camera.position;
    const length = 1000; // Adjust the length of the ray as needed

    // Create a tube to visualize the ray
    const path = [origin, origin.add(direction.scale(length))];
    const tube = MeshBuilder.CreateTube("ray", { path: path, radius: 0.1 }, this.player.game.scene); // Adjust the radius as needed
    const material = new StandardMaterial("tubeMaterial", this.player.game.scene);
    material.emissiveColor = new Color3(1, 0, 0); // Red color for the tube
    tube.material = material;

    // Optionally, remove the tube after some time
    setTimeout(() => {
      tube.dispose();
    }, 1000); // Remove the tube after 1 second

    return;
  }
}
