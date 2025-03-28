import { WeaponRarity } from './weaponRarity';
import { WeaponStatistic } from './weaponStatistic';
import { StaticWeaponStatistic } from './staticWeaponStatistic';
import { WeaponMeshParameter } from './weaponMeshParameters';
import { WeaponType } from './weaponType';

export interface WeaponSerializedData {
  weaponName: WeaponType;
  currentRarity: WeaponRarity;
  globalStats: Array<[WeaponStatistic, Array<number>]>;
  staticStats: Array<[StaticWeaponStatistic, number]>;
  meshParameters: Array<[WeaponMeshParameter, Array<number>]>;
}
