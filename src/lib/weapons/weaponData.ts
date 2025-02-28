import { StaticWeaponStatistic } from './staticWeaponStatistic';
import { WeaponStatistic } from './weaponStatistic';

export interface WeaponData {
  globalStats: Map<WeaponStatistic, Array<number>>;
  staticStats: Map<StaticWeaponStatistic, number>;
}
