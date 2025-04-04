import { Rarity } from '../shop/rarity.ts';
import { Player } from '../player/player';
import {
  Matrix,
  MeshBuilder,
  Observable,
  PhysicsEngineV2,
  PhysicsRaycastResult,
  Quaternion,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import { AssetType } from '../assets/assetType';
import { IDamageable } from '../damageable';
import { WeaponType } from './weaponType';
import { GameAssetContainer } from '../assets/gameAssetContainer';
import { IMetadataObject } from '../metadata/metadataObject';
import { WeaponSerializedData } from './weaponSerializedData';
import { WeaponData } from './weaponData';
import { GlobalStats } from './globalStats';
import {
  WeaponPassivesManager,
  WeaponPassiveType,
} from './passives/weaponPassivesManager';
import { BulletEffect } from './passives/bulletEffect.ts';
import { Enemy } from '../enemies/enemy.ts';

export class Weapon {
  private rootMesh!: TransformNode;
  private firePoint!: TransformNode;
  private gameAssetContainer!: GameAssetContainer;

  // physics
  private raycastResult: PhysicsRaycastResult = new PhysicsRaycastResult();
  private physicsEngine!: PhysicsEngineV2;

  public onReload: Observable<boolean> = new Observable<boolean>();
  public onAmmoChange: Observable<number> = new Observable<number>();

  public weaponData!: WeaponData;
  // Array containing the current stats for the weapon, for the current rarity tier, for easier access
  private currentStats!: GlobalStats;
  public currentRarity!: Rarity;

  private lastWeaponFire = 0;

  public currentAmmoRemaining!: number;
  public isReloading = false;
  private reloadProgress: number = 0;
  private reloadDuration: number = 0;

  // Used for preventing automatic shooting
  public justShot = false;

  // Weapon's mesh moving related
  private initialYPosition: number | null = null;
  private isPlayingMovingAnimating: boolean = false;
  // The speed at which the weapon moves up and down
  private readonly MOVING_ANIMATION_SPEED = 9;
  // The height at which the weapon moves up and down
  private readonly MOVING_ANIMATION_AMPLITUDE = 0.04;
  private readonly VELOCITY_IMPACT_ON_ANIMATION_SPEED = 0.11;

  // Passives related
  // We only store the names of the passives embedded in the weapon
  // The actual instances of the passives are stored in the WeaponPassivesManager
  public embeddedPassives: WeaponPassiveType[] = [];

  public critChanceModifier: number = 0;
  public hpPerHitModifier: number = 0;

  // "Don't Miss" passive related
  public isDontMissPassiveActive: boolean = false;
  public dontMissStackCount: number = 0;
  public dontMissMaxStackCount!: number;
  public dontMissDamageBonusPerStack!: number;

  // Bullet effects
  public bulletEffects: BulletEffect[] = [];

  public akimboWeapon: Weapon | null = null;
  public isAkimboWielding = false;
  private justShotAkimbo = false; // Previous shot was akimbo
  public delayBetweenAlternateShots!: number;

  constructor(
    private player: Player,
    public weaponType: WeaponType,
    rarity: Rarity,
  ) {
    this.player = player;
    this.currentRarity = rarity;
    this.physicsEngine = player.physicsEngine;
    this.weaponData = this.player.game.weaponManager.getWeaponData(this.weaponType);
    this.applyCurrentStats();
  }

  public async init(): Promise<void> {
    await this.initMesh();
    console.log('Wapon initialized: ', this.weaponType);
  }

  private async initMesh(): Promise<void> {
    this.gameAssetContainer = await this.player.game.assetManager.loadGameAssetContainer(
      this.weaponType,
      AssetType.WEAPON,
    );
    this.rootMesh = new TransformNode('weaponRoot', this.player.game.scene);
    this.rootMesh.parent = this.player.cameraManager.getCamera();

    const weaponTransform = this.weaponData.transform;

    this.rootMesh.position = new Vector3(
      weaponTransform.position.x,
      weaponTransform.position.y,
      weaponTransform.position.z,
    );

    const weaponMesh = this.gameAssetContainer.addAssetsToScene();
    weaponMesh.parent = this.rootMesh;

    weaponMesh.rotationQuaternion = Quaternion.FromEulerAngles(
      weaponTransform.rotation.x * (Math.PI / 180),
      weaponTransform.rotation.y * (Math.PI / 180),
      weaponTransform.rotation.z * (Math.PI / 180),
    );
    weaponMesh.scaling = new Vector3(
      weaponTransform.scale,
      weaponTransform.scale,
      weaponTransform.scale,
    );

    this.firePoint = new TransformNode('firePoint', this.player.game.scene);
    this.rootMesh.addChild(this.firePoint);
    this.firePoint.position = new Vector3(
      this.weaponData.firePoint.x,
      this.weaponData.firePoint.y,
      this.weaponData.firePoint.z,
    );

    this.hideInScene();
  }

  public hideInScene(): void {
    this.rootMesh.setEnabled(false);

    if (this.isAkimboWielding) {
      this.akimboWeapon?.hideInScene();
    }
  }

  public showInScene(): void {
    this.rootMesh.setEnabled(true);

    if (this.isAkimboWielding) {
      this.akimboWeapon?.showInScene();
    }
  }

  public isVisible(): boolean {
    return this.rootMesh.isEnabled();
  }


  public fixedUpdate(): void {
    this.updateReload();
  }
  // ---------------------------------------------------------------

  /**
   * Based on the current item's rarity we update its currentStats array
   */
  public applyCurrentStats(): void {
    this.currentStats = this.weaponData.globalStats[this.currentRarity];
    this.currentAmmoRemaining = this.currentStats.magazineSize;
  }

  // --------------------- Shooting related ---------------------------
  // ---------------------------------------------------------------

  /**
   * Handles primary fire for the weapon.
   * Builds the projectiles and shoots them based on the weapon's static stats
   * that describe the weapon's overall behaviour
   */
  public handlePrimaryFire(): void {
    if (this.isAkimboWielding) {
      // If the weapon is akimbo, the shooting logic is different and handled in
      // a separate function
      this.handlePrimaryFireForAkimboWeapon();
      return;
    }

    const currentTime = Date.now();
    const cadency = this.currentStats.cadency * 1000;

    if (!(currentTime - this.lastWeaponFire >= cadency)) {
      return;
    }

    if (this.isReloading) {
      return;
    }

    if (this.currentAmmoRemaining <= 0) {
      return;
    }

    if (!this.weaponData.staticStats.isAutomatic && this.justShot) {
      console.log('Non automatic weapon, cannot hold the trigger');
      return;
    }

    this.lastWeaponFire = currentTime;

    this.fireWeapon();

    if (!this.weaponData.staticStats.isAutomatic) {
      this.justShot = true;
    }
  }

  private handlePrimaryFireForAkimboWeapon(): void {
    const currentTime = Date.now();
    const cadency = this.currentStats.cadency * 1000;
    const akimboDelay = cadency / 2;

    if (this.isReloading) {
      return;
    }

    if (this.currentAmmoRemaining <= 0) {
      return;
    }

    if (!this.weaponData.staticStats.isAutomatic) {
      // Handle non-automatic weapon logic

      if (!this.justShot && currentTime - this.lastWeaponFire >= akimboDelay) {
        if (!this.justShotAkimbo) {
          // Main weapon fires
          this.fireWeapon();
        } else {
          // Akimbo weapon fires
          this.akimboWeapon?.fireWeapon();
        }

        // Alternate the weapon and update the last fire time
        this.justShotAkimbo = !this.justShotAkimbo;
        this.lastWeaponFire = currentTime;
        this.justShot = true; // Prevent further firing until the trigger is released
      }
    } else {
      // Handle automatic weapon logic
      if (currentTime - this.lastWeaponFire >= akimboDelay) {
        if (!this.justShotAkimbo) {
          // Main weapon fires
          this.fireWeapon();
        } else {
          // Akimbo weapon fires
          this.akimboWeapon?.fireWeapon();
        }

        // Alternate the weapon and update the last fire time
        this.justShotAkimbo = !this.justShotAkimbo;
        this.lastWeaponFire = currentTime;
      }
    }
  }

  private fireWeapon(): void {
    const isBurst = this.weaponData.staticStats.isBurst;
    const bulletsPerBurst = this.weaponData.staticStats.burstCount ?? 1;
    const bulletsPerShot = this.weaponData.staticStats.bulletsPerShot;
    const projectionCone = this.weaponData.staticStats.projectionCone;

    if (isBurst) {
      const delayBetweenShotsInBurst =
        this.weaponData.staticStats.delayBetweenBursts ?? 0.1;

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
  }

  /** Calls performRaycast 'bulletsPerShot' times. Calculates a direction for each bullet
   * depending on the projection cone of the weapon (The most obvious example is the shotgun)
   */
  private shootBullets(bulletsPerShot: number, projectionCone: number): void {
    let shotLandedOnEnemy = false;

    const isCriticalHit =
      this.critChanceModifier > 0 && Math.random() < this.critChanceModifier;

    if (projectionCone === 0) {
      for (let i = 0; i < bulletsPerShot; i++) {
        const hit = this.performRaycast(
          this.player.cameraManager.getCamera().getForwardRay().direction,
          isCriticalHit,
        );
        if (hit) {
          shotLandedOnEnemy = true;
        }
      }
    } else {
      for (let i = 0; i < bulletsPerShot; i++) {
        const direction = this.calculateRandomDirection(projectionCone);
        const hit = this.performRaycast(direction, isCriticalHit);
        if (hit) {
          shotLandedOnEnemy = true;
        }
      }
    }

    if (shotLandedOnEnemy) {
      // The shot landed, increasing stack count for dont miss passive
      this.dontMissStackCount = Math.min(
        this.dontMissStackCount + 1,
        this.dontMissMaxStackCount,
      );
    } else {
      // The shot missed, resetting stack count for dont miss passive
      this.dontMissStackCount = 0;
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
  private performRaycast(direction: Vector3, crit: boolean): boolean {
    const start = this.player.cameraManager.getCamera().globalPosition.clone();
    start.addInPlace(
      this.player.cameraManager.getCamera().getForwardRay().direction.scale(0.5),
    );

    const end = start.add(direction.scale(this.currentStats.range));

    this.physicsEngine.raycastToRef(start, end, this.raycastResult, {
      shouldHitTriggers: true,
    });

    // Debug shooting line
    const line = MeshBuilder.CreateLines(
      'lines',
      { points: [this.firePoint.absolutePosition, end] },
      this.player.game.scene,
    );

    setTimeout(() => {
      line.dispose();
    }, 50);
    // --

    if (this.raycastResult.hasHit) {
      const metadata = this.raycastResult.body?.transformNode
        .metadata as IMetadataObject<IDamageable>;
      if (metadata && metadata.isDamageable) {
        const damageableEntity = metadata.object;
        this.dealDamage(damageableEntity, crit);

        if (this.isEnemy(damageableEntity)) {
          return true;
        }
      }
    }

    return false;
  }

  private dealDamage(damageableEntity: IDamageable, crit: boolean): void {
    // Base damage calculation
    const baseDamagePerBullet =
      this.currentStats.damage / this.weaponData.staticStats.bulletsPerShot;

    let damagePerBullet = baseDamagePerBullet;

    // Apply "Don't Miss" passive bonus if active
    if (this.isDontMissPassiveActive) {
      const bonusPercentage = this.dontMissStackCount * this.dontMissDamageBonusPerStack;
      const bonusDamage = damagePerBullet * bonusPercentage;
      damagePerBullet += bonusDamage;
    }

    // Apply critical hit if crit is true
    if (crit) {
      damagePerBullet *= 2;
    }

    damageableEntity.takeDamage(damagePerBullet);

    // Apply bullet effects if any
    if (this.bulletEffects.length > 0 && this.isEnemy(damageableEntity)) {
      for (const effect of this.bulletEffects) {
        damageableEntity.bulletEffectManager.applyEffect(effect);
      }
    }

    // Apply health gain per hit
    this.player.healthController.addHealth(this.hpPerHitModifier);

    console.log('Hit entity, dealt ' + damagePerBullet + ' damage');
  }

  private isEnemy(entity: IDamageable): entity is Enemy {
    return entity instanceof Enemy;
  }

  // --------------------- Ammo related ---------------------------
  // ---------------------------------------------------------------

  public initReload(): void {
    if (this.isAkimboWielding) {
      this.akimboWeapon?.initReload();
    }

    if (this.isReloading) {
      return;
    }

    if (this.currentAmmoRemaining === this.currentStats.magazineSize) {
      console.log('Magazine is full');
      return;
    }

    this.isReloading = true;
    this.reloadProgress = 0;
    this.reloadDuration = this.currentStats.reloadTime * 1000;
    this.onReload.notifyObservers(true);
  }

  public updateReload(): void {
    if (this.isAkimboWielding) {
      this.akimboWeapon?.updateReload();
    }

    if (!this.isReloading) {
      return;
    }

    const deltaTime = this.player.game.getFixedDeltaTime();
    this.reloadProgress += deltaTime;

    if (this.reloadProgress >= this.reloadDuration) {
      this.currentAmmoRemaining = this.currentStats.magazineSize;
      this.onAmmoChange.notifyObservers(this.currentAmmoRemaining);
      this.isReloading = false;
      this.justShotAkimbo = false;
      this.reloadProgress = 0;
      this.onReload.notifyObservers(false);
    }
  }

  // --------------------- Moving effect related ---------------------------
  // ---------------------------------------------------------------

  /** Moves up and down the weapon's mesh when the player is moving to produce a speed and moving effect */
  public updatePosition(playerVelocity: Vector3): void {
    if (this.isAkimboWielding) {
      // If akimbo then we also need to update the other weapon
      this.akimboWeapon?.updatePosition(playerVelocity);
    }

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
      this.initialYPosition = this.rootMesh.position.y;
    }
    const amplitude = this.MOVING_ANIMATION_AMPLITUDE;
    const frequency =
      this.MOVING_ANIMATION_SPEED *
      (this.VELOCITY_IMPACT_ON_ANIMATION_SPEED * velocity.length());
    this.isPlayingMovingAnimating = true;
    const initialYPosition = this.rootMesh.position.y;
    const startTime = performance.now();

    const animate = () => {
      if (!this.isPlayingMovingAnimating) {
        return;
      }

      const elapsedTime = performance.now() - startTime;
      const time = (elapsedTime / 1000) * frequency;
      const offsetY = Math.sin(time) * amplitude;
      this.rootMesh.position.y = initialYPosition + offsetY;
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  /** Stops the mesh moving animation by smoothly returning its position to original */
  private stopAnimation(): void {
    if (this.isPlayingMovingAnimating) {
      this.isPlayingMovingAnimating = false;
      const currentYPosition = this.rootMesh.position.y;
      const targetYPosition = this.initialYPosition!;
      const duration = 300;
      const startTime = performance.now();

      const smoothReset = (time: number) => {
        const elapsed = time - startTime;
        const t = Math.min(elapsed / duration, 1);
        this.rootMesh.position.y =
          currentYPosition + t * (targetYPosition - currentYPosition);

        if (t < 1) {
          requestAnimationFrame(smoothReset);
        } else {
          this.rootMesh.position.y = targetYPosition;
        }
      };

      requestAnimationFrame(smoothReset);
    }
  }

  public dispose(): void {
    if (this.isAkimboWielding) {
      this.akimboWeapon?.dispose();
    }
    this.rootMesh.dispose();
    this.firePoint.dispose();
    this.gameAssetContainer.dispose();
  }

  // Saving related - Serializing and deserializing the weapon
  // ---------------------------------------------------------------

  /**
   * Serializes the weapon into a JSON-compatible object.
   */
  public serialize(): WeaponSerializedData {
    return {
      weaponType: this.weaponType,
      currentRarity: this.currentRarity,
      embeddedPassives: this.embeddedPassives,
    };
  }

  /**
   * Deserializes a JSON-compatible object into a Weapon instance.
   */
  public static deserialize(data: WeaponSerializedData, player: Player): Weapon {
    const weapon = new Weapon(player, data.weaponType, data.currentRarity);

    // Reset weapon data arrays. This step is mandatory, we need to reset
    // to "factory settings" the weapon data arrays, otherwise we will apply
    // passives to already altered stats.
    weapon.weaponData = weapon.player.game.weaponManager.getWeaponData(weapon.weaponType);
    weapon.applyCurrentStats();

    const pm = WeaponPassivesManager.getInstance();
    // We need to reapply the passives to the weapon
    pm.applyPassivesToWeapon(weapon, data.embeddedPassives);

    return weapon;
  }

  /** Returns a new instance of a weapon, copied from this one */
  public cloneWeapon(): Weapon {
    const newWeapon = new Weapon(this.player, this.weaponType, this.currentRarity);
    newWeapon.weaponData = structuredClone(this.weaponData);
    newWeapon.applyCurrentStats();

    return newWeapon;
  }
}
