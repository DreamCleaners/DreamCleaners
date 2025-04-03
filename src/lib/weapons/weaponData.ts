import { GlobalStats } from './globalStats';

export type WeaponData = {
  weaponName: string;
  globalStats: GlobalStats[];
  staticStats: StaticStats;
  transform: WeaponTransform;
  firePoint: Vec3;
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
  scale: number;
};

export type Vec3 = {
  x: number;
  y: number;
  z: number;
};
