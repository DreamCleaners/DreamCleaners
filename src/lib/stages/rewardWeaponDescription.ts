import { Rarity } from '../shop/rarity';
import { WeaponPassiveType } from '../weapons/passives/weaponPassivesManager';
import { WeaponType } from '../weapons/weaponType';

/** Contains basic information on the weapon that will be a stage reward
 * We will use these information to actually create the weapon when the stage's completed
 * */
export class RewardWeaponDescription {
  constructor(
    public weaponType: WeaponType,
    public rarity: Rarity,
    public embeddedPassives: WeaponPassiveType[],
  ) {}
}
