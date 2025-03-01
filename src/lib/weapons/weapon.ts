import { WeaponRarity } from './weaponRarity';
import { WeaponStatistic } from './weaponStatistic';
import { StaticWeaponStatistic } from './staticWeaponStatistic';
import { Player } from '../player';
import {
  AbstractMesh,
  Matrix,
  Mesh,
  MeshBuilder,
  PhysicsEngineV2,
  PhysicsRaycastResult,
  Quaternion,
  Vector3,
} from '@babylonjs/core';
import { AssetType } from '../assetType';
import { IDamageable } from '../damageable';
import { WeaponData } from './weaponData';
import { WeaponMeshParameter } from './weaponMeshParameters';

export class Weapon implements WeaponData {
  private mesh!: AbstractMesh;
  private player!: Player;
  public weaponName!: string;
  public currentRarity!: WeaponRarity;
  private raycastResult: PhysicsRaycastResult = new PhysicsRaycastResult();
  private physicsEngine!: PhysicsEngineV2;

  // Array containing all non static stats for the weapon, for every rarity tier
  public globalStats!: Map<WeaponStatistic, Array<number>>;

  // Array containing the current stats for the weapon, for the current rarity tier, for easier access
  private currentStats!: Map<WeaponStatistic, number>;

  public staticStats!: Map<StaticWeaponStatistic, number>;

  private lastWeaponFire = 0;

  public currentAmmoRemaining!: number;
  private isReloading = false;

  public justShot = false;
  // Used for preventing automatic shooting

  // Values for the weapon's mesh
  public meshParameters!: Map<WeaponMeshParameter, Array<number>>;

  constructor(player: Player, name: string, rarity: WeaponRarity) {
    this.player = player;
    this.currentRarity = rarity;
    this.weaponName = name;
    this.physicsEngine = player.game.scene.getPhysicsEngine() as PhysicsEngineV2;
    this.initArrays();
    this.loadJSONIntoArrays().then(() => {
      this.initMesh();
    });
  }

  // ----------------- Container related (babylon) -----------------
  // ---------------------------------------------------------------

  private async initMesh(): Promise<void> {
    const entries = await this.player.game.assetManager.loadAsset(
      this.weaponName,
      AssetType.WEAPON,
    );
    console.log('Init mesh for weapon ' + this.weaponName);
    this.mesh = entries.rootNodes[0] as Mesh;
    this.mesh.parent = this.player.camera;

    const meshPositionArray = this.meshParameters.get(WeaponMeshParameter.POSITION);
    const meshRotationArray = this.meshParameters.get(WeaponMeshParameter.ROTATION);
    const meshScaleArray = this.meshParameters.get(WeaponMeshParameter.SCALE);

    if (meshPositionArray && meshRotationArray && meshScaleArray) {
      const meshPosition = new Vector3(
        meshPositionArray[0],
        meshPositionArray[1],
        meshPositionArray[2],
      );
      const meshRotation = new Vector3(
        meshRotationArray[0],
        meshRotationArray[1],
        meshRotationArray[2],
      );
      const meshScale = meshScaleArray[0];
      console.log('mesh scale array: ' + meshScaleArray);
      console.log('Mesh scale: ' + meshScale);

      console.log('Adding in place at ' + meshPosition);
      this.mesh.position.addInPlace(meshPosition);
      console.log('Setting rotation to ' + meshRotation);
      this.mesh.rotation = meshRotation;
      console.log('Setting scaling to ' + meshScale);
      this.mesh.scaling = new Vector3(meshScale, meshScale, meshScale);
    } else {
      console.error('Mesh parameters not found for weapon ' + this.weaponName);
    }

    this.hideInScene();

    // TODO! Remove this, only present until the stages are implemented as it will be gameScene's (or sceneManager)
    // role to show the weapon at stage entrance.
    if (this.weaponName === 'ak') {
      console.log('Showing the ak');
      this.showInScene();
    }
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
    this.meshParameters = new Map<WeaponMeshParameter, Array<number>>();
  }

  /** Parses JSON of the weapon stats and mesh parameters and load it into class' arrays fields */
  private async loadJSONIntoArrays(): Promise<void> {
    try {
      const data = await this.player.game.assetManager.loadWeaponJson(this.weaponName);

      if (data) {
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

        // Load mesh parameters
        for (const [key, values] of Object.entries(data.meshParameters)) {
          const enumKey = WeaponMeshParameter[key as keyof typeof WeaponMeshParameter];
          console.log(`Key: ${key}, Enum Key: ${enumKey}, Values: ${values}`);
          if (enumKey === undefined) {
            console.error(`Invalid key: ${key}`);
            continue;
          }
          if (key === 'ROTATION') {
            // Convert string values to numbers
            const rotationValues = (values as Array<string>).map((value) => {
              return eval(value.replace('PI', 'Math.PI'));
            });
            this.meshParameters.set(enumKey, rotationValues);
          } else if (key === 'SCALE') {
            // Convert single number to array
            this.meshParameters.set(enumKey, [values as number]);
          } else {
            this.meshParameters.set(enumKey, values as Array<number>);
          }
        }
      } else {
        console.error(`No data found for weapon ${this.weaponName}`);
      }
    } catch (error) {
      console.error(
        `Could not load JSON data for weapon of name ${this.weaponName}, error trace: ${error}`,
      );
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

    this.currentAmmoRemaining = this.getStat(WeaponStatistic.MAGAZINE_CAPACITY);
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

  private getStaticStat(stat: StaticWeaponStatistic): number {
    const ret = this.staticStats.get(stat);
    if (ret === undefined) {
      console.error(`Static Stat ${stat} not found for weapon ${this.weaponName}`);
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

    if (this.isReloading) {
      console.log('Cannot shoot while reloading');
      return;
    }

    if (this.currentAmmoRemaining <= 0) {
      console.log('Out of ammo!');
      return;
    }

    if (!this.staticStats.get(StaticWeaponStatistic.IS_AUTOMATIC) && this.justShot) {
      console.log('Non automatic weapon, cannot hold the trigger');
      return;
    }

    this.lastWeaponFire = currentTime;

    const isBurst = this.getStaticStat(StaticWeaponStatistic.IS_BURST) || false;
    const bulletsPerBurst =
      this.getStaticStat(StaticWeaponStatistic.BULLETS_PER_BURST) || 1;
    const bulletsPerShot =
      this.getStaticStat(StaticWeaponStatistic.BULLETS_PER_SHOT) || 1;
    const projectionCone = this.getStaticStat(StaticWeaponStatistic.PROJECTION_CONE) || 0;

    if (isBurst) {
      const delayBetweenShotsInBurst =
        this.getStaticStat(StaticWeaponStatistic.DELAY_BETWEEN_SHOTS_IN_BURST) || 0;

      for (let i = 0; i < bulletsPerBurst; i++) {
        setTimeout(
          () => {
            if (this.currentAmmoRemaining <= 0) {
              console.log('Out of ammo!');
              return;
            }
            this.shootBullets(bulletsPerShot, projectionCone);
            this.currentAmmoRemaining--;
          },
          i * delayBetweenShotsInBurst * 1000,
        ); // We space each bullet of the burst by a delay
      }
    } else {
      this.shootBullets(bulletsPerShot, projectionCone);
      this.currentAmmoRemaining--;
    }

    if (!this.staticStats.get(StaticWeaponStatistic.IS_AUTOMATIC)) {
      this.justShot = true;
    }
  }

  /** Calls performRaycast 'bulletsPerShot' times. Calculates a direction for each bullet
   * depending on the projection cone of the weapon (The most obvious example is the shotgun)
   */
  private shootBullets(bulletsPerShot: number, projectionCone: number): void {
    if (projectionCone === 0) {
      // Not a "cone" weapon, just shoot straight in the direction of the camera
      for (let i = 0; i < bulletsPerShot; i++) {
        this.performRaycast(this.player.camera.getForwardRay().direction);
      }
    } else {
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

  /** Performs a raycast in a given direction */
  private performRaycast(direction: Vector3): void {
    // The raycasts stars at the player's camera position and not at the weapon's position
    // Thus, we need to add a small offset to the start position in order not to hit the player
    const start = this.player.camera.globalPosition.clone();
    start.addInPlace(this.player.camera.getForwardRay().direction.scale(0.5));

    const end = start.add(direction.scale(this.getStat(WeaponStatistic.RANGE)));

    this.physicsEngine.raycastToRef(start, end, this.raycastResult);

    if (this.raycastResult.hasHit && this.raycastResult.body?.transformNode.metadata) {
      const damageableEntity = this.raycastResult.body?.transformNode
        .metadata as IDamageable;

      // We deal damage to the entity, based on the weapon damage and the amount of bullets in one shot
      const damagePerBullet =
        this.getStat(WeaponStatistic.DAMAGE) /
        this.getStaticStat(StaticWeaponStatistic.BULLETS_PER_SHOT);

      damageableEntity.takeDamage(damagePerBullet);

      console.log('Hit entity, dealt ' + damagePerBullet + ' damage');
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

  // --------------------- Ammo related ---------------------------
  // ---------------------------------------------------------------

  public reload(): void {
    if (this.isReloading) {
      console.log('Already reloading');
      return;
    }

    if (this.currentAmmoRemaining === this.getStat(WeaponStatistic.MAGAZINE_CAPACITY)) {
      console.log('Magazine is full');
      return;
    }

    this.isReloading = true;
    setTimeout(
      () => {
        this.currentAmmoRemaining = this.getStat(WeaponStatistic.MAGAZINE_CAPACITY);
        this.isReloading = false;
        console.log('Done reloading');
      },
      this.getStat(WeaponStatistic.RELOAD_TIME) * 1000,
    );
  }
}
