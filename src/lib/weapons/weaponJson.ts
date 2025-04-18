import { GlobalStatsJson } from './globalStats';
import { StaticStats, Vec3, WeaponAnimationsSpeed, WeaponTransform } from './weaponData';

export type WeaponJson = {
  weaponName: string;
  crosshairName: string;
  globalStats: GlobalStatsJson;
  staticStats: StaticStats;
  transform: WeaponTransform;
  firePoint: Vec3;
  animationsSpeed: WeaponAnimationsSpeed;
};
