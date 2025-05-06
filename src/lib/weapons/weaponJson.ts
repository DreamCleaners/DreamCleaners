import { GlobalStatsJson } from './globalStats';
import {
  CrosshairData,
  StaticStats,
  Vec3,
  WeaponAnimationsSpeed,
  WeaponTransform,
} from './weaponData';

export type WeaponJson = {
  weaponName: string;
  shopDescription: string;
  crosshair: CrosshairData;
  globalStats: GlobalStatsJson;
  staticStats: StaticStats;
  transform: WeaponTransform;
  firePoint: Vec3;
  animationsSpeed: WeaponAnimationsSpeed;
};
