import { Vec3 } from '../utils/jsonTypes';
import { GlobalStatsJson } from './globalStats';
import {
  CrosshairData,
  StaticStats,
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
  akimboTransform?: WeaponTransform;
  akimboFirePoint?: Vec3;
};
