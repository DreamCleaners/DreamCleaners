import { StaticWeaponStatistic } from './staticWeaponStatistic';
import { WeaponMeshParameter } from './weaponMeshParameters';
import { WeaponStatistic } from './weaponStatistic';

export interface WeaponData {
  globalStats: Map<WeaponStatistic, Array<number>>;
  staticStats: Map<StaticWeaponStatistic, number>;
  meshParameters: Map<WeaponMeshParameter, Array<number>>;
}
