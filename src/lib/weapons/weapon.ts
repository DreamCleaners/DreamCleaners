import { Container } from 'react-dom/client';
import { Game } from '../game';
import { WeaponRarity } from './weaponRarity';
import { WeaponStatistic } from './weaponStatistic';
import { StaticWeaponStatistic } from './staticWeaponStatistic';

export class Weapon {
  public container!: Container;

  private game!: Game;

  public weaponName!: string;

  public currentRarity!: WeaponRarity;

  private globalStats!: Map<WeaponStatistic, Array<number>>;
  // Array containing all non static stats for the weapon, for every rarity tier

  private currentStats!: Map<WeaponStatistic, number>;
  // Array containing the current stats for the weapon, for the current rarity tier, for easier access

  private staticStats!: Map<StaticWeaponStatistic, number>;

  constructor(game: Game, name: string, rarity: WeaponRarity) {
    this.game = game;
    this.currentRarity = rarity;
    this.weaponName = name;
    this.initArrays();
    this.loadStatsFromJSON();

    // TO SATISFY THE FREAKING LEFTHOOK
    console.log(
      'Initiated weapon: ' +
        this.weaponName +
        ' of rarity: ' +
        WeaponRarity[this.currentRarity], + " game: " + String(this.game),
    );
  }

  private initArrays(): void {
    this.globalStats = new Map<WeaponStatistic, Array<number>>();
    this.currentStats = new Map<WeaponStatistic, number>();
    this.staticStats = new Map<StaticWeaponStatistic, number>();
  }

  /** Parses JSON of the weapon stats and load it into class' arrays fields */
  private async loadStatsFromJSON(): Promise<void> {
    const name = this.weaponName.toLowerCase();
    console.log('Loading stats from JSON for weapon: ' + name);
    try {
      const response = await fetch(`/weapons/stats/${name}.json`);
      if (!response.ok) {
        throw new Error(`Weapon stats for ${this.weaponName} not found`);
      } else console.log('Stats found for weapon: ' + this.weaponName);
      const data = await response.json();

      // Load global stats
      for (const [key, values] of Object.entries(data.globalStats)) {
        this.globalStats.set(
          WeaponStatistic[key as keyof typeof WeaponStatistic],
          values as Array<number>,
        );
      }

      // Load static stats
      for (const [key, value] of Object.entries(data.staticStats)) {
        this.staticStats.set(
          StaticWeaponStatistic[key as keyof typeof StaticWeaponStatistic],
          value as number,
        );
      }
    } catch (error) {
      console.error(`Could not load stats from JSON for weapon of name ${this.weaponName},
                 error trace: ${error}`);
    }

    this.applyCurrentStats();

    console.log('Get damage: ' + this.getStat(WeaponStatistic.DAMAGE));
  }

  /** Based on the current item's rarity we update its currentStats array */
  private applyCurrentStats(): void {
    if (this.globalStats.size === 0) {
      console.error('Global stats not loaded, cannot apply current stats');
      return;
    }

    for (const [key, value] of this.globalStats) {
      this.currentStats.set(key, value[this.currentRarity]);
      console.log(
        'Current stat for ' + WeaponStatistic[key] + ' is: ' + this.currentStats.get(key),
      );
    }
  }

  /** Returns the current value of the weapon given stat */
  public getStat(stat: WeaponStatistic): number {
    const ret = this.currentStats.get(stat);
    if (ret === undefined) {
      console.error(`Stat ${stat} not found for weapon ${this.weaponName}`);
      return -1;
    }
    return ret;
  }
}
