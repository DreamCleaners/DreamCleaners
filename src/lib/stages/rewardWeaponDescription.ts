/** Contains basic information on the weapon that will be a stage reward
 * We will use these information to actually create the weapon when the stage's completed
 * */
export class RewardWeaponDescription {
  constructor(
    public weaponType: string,
    public rarity: number,
  ) {}
}
