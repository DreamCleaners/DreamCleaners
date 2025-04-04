import { Weapon } from "../../weapon";
import { WeaponPassive } from "../weaponPassive";
import { WeaponPassiveType, WeaponPassiveT3 } from "../weaponPassivesManager";

export class MoreBullets extends WeaponPassive {
    public name: string = 'I need more bullets';
    private readonly MAGAZINE_CAPACITY_INCREASE: number = 0.5; // 50% more bullets
    private readonly DAMAGE_INCREASE: number = 0.33; // 33% more damage

    public description: string = "Your weapon now shoots per bursts of three bullets." +
        " If it is already a burst weapon, it doubles the amount of bullets per burst" +
        ". Additionally, the magazine capacity is increased by " + 
        this.MAGAZINE_CAPACITY_INCREASE * 100 + "% and the weapon's damage by " +
        this.DAMAGE_INCREASE * 100 + "%.";


    public enumName: WeaponPassiveType = WeaponPassiveT3.I_NEED_MORE_BULLETS;

    public override embedPassiveToWeapon(weapon: Weapon): void {
        super.embedPassiveToWeapon(weapon);

        const isBurstType = weapon.weaponData.staticStats.isBurst;

        if(!isBurstType) {
            weapon.weaponData.staticStats.burstCount = 3;
            weapon.weaponData.staticStats.isBurst = true;

            // We decrease the weapon's cadency
            // To smooth the burst effect, in order not to make it too fast

            for(const rarity in weapon.weaponData.globalStats) {
                const stats = weapon.weaponData.globalStats[rarity];
                stats.cadency *= 1.50;
            }
                
            weapon.weaponData.globalStats[weapon.currentRarity].cadency *= 1.50;

            weapon.weaponData.staticStats.delayBetweenBursts =
                weapon.weaponData.globalStats[weapon.currentRarity].cadency * 0.32;

            // We set the delay between bursts to allow the full burst to be fired
            // before the next one

         }
        else {
            weapon.weaponData.staticStats.burstCount = (weapon.weaponData.staticStats.burstCount ?? 3) * 2;
            weapon.weaponData.staticStats.delayBetweenBursts =
                weapon.weaponData.globalStats[weapon.currentRarity].cadency * 0.15;

        }

        // Also increase the magazine capacity and damage for all rarities
        for (const rarity in weapon.weaponData.globalStats) {
            const stats = weapon.weaponData.globalStats[rarity];
            stats.magazineSize += Math.floor(stats.magazineSize * this.MAGAZINE_CAPACITY_INCREASE);
            stats.damage += Math.floor(stats.damage * this.DAMAGE_INCREASE);
        }

        // As we alter magazine capacity we must also update the current ammo
        weapon.currentAmmoRemaining = weapon.weaponData.globalStats[weapon.currentRarity].magazineSize;

    }
}