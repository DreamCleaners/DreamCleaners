import { Vec3 } from '../utils/jsonTypes';
import { GlobalStats } from './globalStats';

export type WeaponData = {
  weaponName: string;
  shopDescription: string;
  crosshair: CrosshairData;
  globalStats: GlobalStats[];
  staticStats: StaticStats;
  transform: WeaponTransform;
  firePoint: Vec3;
  animationsSpeed: WeaponAnimationsSpeed;
};

export type StaticStats = {
  isAutomatic: boolean;
  isBurst: boolean;
  burstCount?: number;
  delayBetweenBursts?: number;
  bulletsPerShot: number;
  projectionCone: number;
  knockback: number;
};

export type WeaponTransform = {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
};

export type WeaponAnimationsSpeed = {
  shoot?: number;
  reload?: number;
};

export type CrosshairData = {
  name: string;
  scale: number;
};
