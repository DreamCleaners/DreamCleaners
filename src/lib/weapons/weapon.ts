import { WeaponRarity } from './weaponRarity';
import { WeaponStatistic } from './weaponStatistic';
import { StaticWeaponStatistic } from './staticWeaponStatistic';
import { Player } from '../player/player';
import {
  AbstractMesh,
  Matrix,
  MeshBuilder,
  Observable,
  PhysicsEngineV2,
  PhysicsRaycastResult,
  Quaternion,
  Vector3,
} from '@babylonjs/core';
import { AssetType } from '../assets/assetType';
import { IDamageable } from '../damageable';
import { WeaponData } from './weaponData';
import { WeaponMeshParameter } from './weaponMeshParameters';
import { WeaponType } from './weaponType';
import { GameAssetContainer } from '../assets/gameAssetContainer';
import { IMetadataObject } from '../metadata/metadataObject';
import { WeaponSerializedData } from './weaponSerializedData';

export class Weapon implements WeaponData {
  private mesh!: AbstractMesh;
  private player!: Player;
  public weaponName!: string;
  public currentRarity!: WeaponRarity;
  private raycastResult: PhysicsRaycastResult = new PhysicsRaycastResult();
  private physicsEngine!: PhysicsEngineV2;

  private gameAssetContainer!: GameAssetContainer;

  public onReload: Observable<boolean> = new Observable<boolean>();
  public onAmmoChange: Observable<number> = new Observable<number>();

  // Array containing all non static stats for the weapon, for every rarity tier
  public globalStats!: Map<WeaponStatistic, Array<number>>;

  // Array containing the current stats for the weapon, for the current rarity tier, for easier access
  private currentStats!: Map<WeaponStatistic, number>;

  public staticStats!: Map<StaticWeaponStatistic, number>;

  private lastWeaponFire = 0;

  public currentAmmoRemaining!: number;
  public isReloading = false;
  private reloadProgress: number = 0;
  private reloadDuration: number = 0;

  // Used for preventing automatic shooting
  public justShot = false;

  // Values for the weapon's mesh
  public meshParameters!: Map<WeaponMeshParameter, Array<number>>;

  // Weapon's mesh moving related
  private initialYPosition: number | null = null;
  private isPlayingMovingAnimating: boolean = false;
  // The speed at which the weapon moves up and down
  private readonly MOVING_ANIMATION_SPEED = 9;
  // The height at which the weapon moves up and down
  private readonly MOVING_ANIMATION_AMPLITUDE = 0.04;
  private readonly VELOCITY_IMPACT_ON_ANIMATION_SPEED = 0.11;

  constructor(player: Player, name: WeaponType, rarity: WeaponRarity) {
    this.player = player;
    this.currentRarity = rarity;
    this.weaponName = name.toLowerCase();
    this.physicsEngine = player.physicsEngine;
    this.initArrays();
    this.loadJSONIntoArrays();
  }

  // ----------------- Asset container related (babylon) -----------------
  // ---------------------------------------------------------------

  public async initMesh(): Promise<void> {
    this.gameAssetContainer = await this.player.game.assetManager.loadGameAssetContainer(
      this.weaponName,
      AssetType.WEAPON,
    );
    this.mesh = this.gameAssetContainer.addAssetsToScene();
    this.mesh.parent = this.player.cameraManager.getCamera();

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
      this.mesh.position.addInPlace(meshPosition);
      this.mesh.rotation = meshRotation;
      this.mesh.scaling = new Vector3(meshScale, meshScale, meshScale);
    } else {
      console.error('Mesh parameters not found for weapon ' + this.weaponName);
    }

    this.hideInScene();
  }

  public hideInScene(): void {
    this.mesh.setEnabled(false);
  }

  public showInScene(): void {
    this.mesh.setEnabled(true);
  }

  public fixedUpdate(): void {
    this.updateReload();
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
      return;
    }

    if (this.currentAmmoRemaining <= 0) {
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

      const shotsFired = Math.min(bulletsPerBurst, this.currentAmmoRemaining);

      for (let i = 0; i < shotsFired; i++) {
        setTimeout(
          () => {
            this.shootBullets(bulletsPerShot, projectionCone);
            this.currentAmmoRemaining--;
            this.onAmmoChange.notifyObservers(this.currentAmmoRemaining);
          },
          i * delayBetweenShotsInBurst * 1000,
        );
      }

    } else {
      this.shootBullets(bulletsPerShot, projectionCone);
      this.currentAmmoRemaining--;
    }

    this.onAmmoChange.notifyObservers(this.currentAmmoRemaining);

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
        this.performRaycast(
          this.player.cameraManager.getCamera().getForwardRay().direction,
        );
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
    const forward = this.player.cameraManager.getCamera().getForwardRay().direction;

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
    const start = this.player.cameraManager.getCamera().globalPosition.clone();
    start.addInPlace(
      this.player.cameraManager.getCamera().getForwardRay().direction.scale(0.5),
    );

    const end = start.add(direction.scale(this.getStat(WeaponStatistic.RANGE)));

    this.physicsEngine.raycastToRef(start, end, this.raycastResult, {
      shouldHitTriggers: true,
    });

    if (this.raycastResult.hasHit) {
      const metadata = this.raycastResult.body?.transformNode
        .metadata as IMetadataObject<IDamageable>;
      if (metadata && metadata.isDamageable) {
        const damageableEntity = metadata.object;

        // We deal damage to the entity, based on the weapon damage and the amount of bullets in one shot
        const damagePerBullet =
          this.getStat(WeaponStatistic.DAMAGE) /
          this.getStaticStat(StaticWeaponStatistic.BULLETS_PER_SHOT);

        damageableEntity.takeDamage(damagePerBullet);

        console.log('Hit entity, dealt ' + damagePerBullet + ' damage');
      }
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

  public initReload(): void {
    if (this.isReloading) {
      return;
    }

    if (this.currentAmmoRemaining === this.getStat(WeaponStatistic.MAGAZINE_CAPACITY)) {
      console.log('Magazine is full');
      return;
    }

    this.isReloading = true;
    this.reloadProgress = 0;
    this.reloadDuration = this.getStat(WeaponStatistic.RELOAD_TIME) * 1000;
    this.onReload.notifyObservers(true);
  }

  public updateReload(): void {
    if (!this.isReloading) {
      return;
    }

    const deltaTime = this.player.game.getFixedDeltaTime();
    this.reloadProgress += deltaTime;

    if (this.reloadProgress >= this.reloadDuration) {
      this.currentAmmoRemaining = this.getStat(WeaponStatistic.MAGAZINE_CAPACITY);
      this.onAmmoChange.notifyObservers(this.currentAmmoRemaining);
      this.isReloading = false;
      this.reloadProgress = 0;
      this.onReload.notifyObservers(false);
    }
  }

  // --------------------- Moving effect related ---------------------------
  // ---------------------------------------------------------------

  /** Moves up and down the weapon's mesh when the player is moving to produce a speed and moving effect */
  public updatePosition(playerVelocity: Vector3): void {
    if (playerVelocity.length() > 0) {
      // Player is moving
      if (!this.isPlayingMovingAnimating) {
        this.animateWeaponMovement(playerVelocity);
      }
    } else {
      // Player stopped moving
      this.stopAnimation();
    }

    if (this.player.isSliding) {
      this.stopAnimation();
    }
  }

  /** Continuously moves the weapon up and down to match the player's movements */
  private animateWeaponMovement(velocity: Vector3): void {
    if (this.initialYPosition === null) {
      this.initialYPosition = this.mesh.position.y;
    }
    const amplitude = this.MOVING_ANIMATION_AMPLITUDE;
    const frequency =
      this.MOVING_ANIMATION_SPEED *
      (this.VELOCITY_IMPACT_ON_ANIMATION_SPEED * velocity.length());
    this.isPlayingMovingAnimating = true;
    const initialYPosition = this.mesh.position.y;
    const startTime = performance.now();

    const animate = () => {
      if (!this.isPlayingMovingAnimating) {
        return;
      }

      const elapsedTime = performance.now() - startTime;
      const time = (elapsedTime / 1000) * frequency;
      const offsetY = Math.sin(time) * amplitude;
      this.mesh.position.y = initialYPosition + offsetY;
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  /** Stops the mesh moving animation by smoothly returning its position to original */
  private stopAnimation(): void {
    if (this.isPlayingMovingAnimating) {
      this.isPlayingMovingAnimating = false;
      const currentYPosition = this.mesh.position.y;
      const targetYPosition = this.initialYPosition!;
      const duration = 300;
      const startTime = performance.now();

      const smoothReset = (time: number) => {
        const elapsed = time - startTime;
        const t = Math.min(elapsed / duration, 1);
        this.mesh.position.y =
          currentYPosition + t * (targetYPosition - currentYPosition);

        if (t < 1) {
          requestAnimationFrame(smoothReset);
        } else {
          this.mesh.position.y = targetYPosition;
        }
      };

      requestAnimationFrame(smoothReset);
    }
  }

  public dispose(): void {
    this.mesh.dispose();
  }

  // Saving related - Serializing and deserializing the weapon
  // ---------------------------------------------------------------

  /**
   * Serializes the weapon into a JSON-compatible object.
   */
  public serialize(): WeaponSerializedData {
    return {
      weaponName: WeaponType[this.weaponName.toUpperCase() as keyof typeof WeaponType],
      currentRarity: this.currentRarity,
      globalStats: Array.from(this.globalStats.entries()),
      staticStats: Array.from(this.staticStats.entries()),
      meshParameters: Array.from(this.meshParameters.entries()),
    };
  }

  /**
   * Deserializes a JSON-compatible object into a Weapon instance.
   */
  public static deserialize(data: WeaponSerializedData, player: Player): Weapon {
    const weapon = new Weapon(player, data.weaponName, data.currentRarity);

    weapon.globalStats = new Map(data.globalStats);
    weapon.staticStats = new Map(data.staticStats);
    weapon.meshParameters = new Map(data.meshParameters);

    weapon.applyCurrentStats();

    return weapon;
  }
}
