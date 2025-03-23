import { EnemyType } from '../enemies/enemyType';
import { Bed } from '../interactiveElements/bed';
import { FixedStageLayout } from '../scenes/fixedStageLayout';
import { StageReward } from './stageReward';

/** The purpose of this class is to manage proposed stages to the player, the stage rewards and so on */
export class StagesManager {
  private static _instance: StagesManager;
  private selectedbed !: Bed;

  private constructor() {}

  public static getInstance(): StagesManager {
    if (!StagesManager._instance) {
      StagesManager._instance = new StagesManager();
    }
    return StagesManager._instance;
  }

  /** Based on current run's progress, will edit each bed of the HUB so they propose various stages */
  public setProposedStagesForBeds(beds: Bed[]): void {
    const n = beds.length;

    console.log('Making up stages for beds to propose, there are ' + n + ' beds');

    if (n === 0) {
      console.log(
        'Stage manager tried to set proposed stages for beds but an empty array was given',
      );
      return;
    }

    // For each bed we need to set the difficulty factor, the enemy types to spawn, the stage reward and finally the layout
    // (if the stage is not procedural)
    const alreadyPickedFixedLayouts = new Set<FixedStageLayout>();

    for (let i = 0; i < n; i++) {
      const bed = beds[i];
      const difficultyFactor = this.pickRandomDifficulty();
      const enemyTypes = this.pickRandomEnemyTypes();
      const reward = this.pickRandomReward();
      let layout!: FixedStageLayout;

      if (!bed.isStageProcedural) {
        layout = this.pickRandomFixedLayout(alreadyPickedFixedLayouts);
        alreadyPickedFixedLayouts.add(layout);
      }

      // For now only fixed stages are implemented
      bed.setFixedStageProperties({
        layout: layout,
        difficulty: difficultyFactor,
        enemies: enemyTypes,
        reward: reward,
      });
    }
  }

  /** Picks a random fixed layout, tries not to re-pick an already proposed scene */
  private pickRandomFixedLayout(
    alreadyPickedFixedLayouts: Set<FixedStageLayout>,
  ): FixedStageLayout {
    const keys = Object.keys(FixedStageLayout) as Array<keyof typeof FixedStageLayout>;

    // All pickable layouts, meaning every layouts (even already picked) except the HUB
    const layouts = keys
      .map((key) => FixedStageLayout[key])
      .filter((layout) => layout !== FixedStageLayout.HUB);

    // We create a weighted array, we give a weight of each pickable layout
    // Unpicked layouts have a higher weight
    const weightedLayouts: FixedStageLayout[] = [];
    layouts.forEach((layout) => {
      const weight = alreadyPickedFixedLayouts.has(layout) ? 1 : 5;
      // Higher weight for unpicked layouts
      for (let i = 0; i < weight; i++) {
        weightedLayouts.push(layout);
      }
    });

    // Pick a random layout from the weighted array
    const randomIndex = Math.floor(Math.random() * weightedLayouts.length);
    return weightedLayouts[randomIndex];
    //return FixedStageLayout.CLOSED_SCENE;
  }

  private pickRandomDifficulty(): number {
    // For now it's simply a random number between 1 and 2
    // Later we will base ourself on the run's progression (not yet implemented)
    return Math.floor(Math.random() * 2) + 1;
  }

  /** Picks enemyTypes to spawn in the stage, completely random ! */
  private pickRandomEnemyTypes(): EnemyType[] {
    const enemyTypesKeys = Object.keys(EnemyType).filter((key) => isNaN(Number(key))); // Get only the string keys of the enum
    const enemyTypesLength = enemyTypesKeys.length;
    const amountOfTypesToSpawn = Math.floor(Math.random() * enemyTypesLength) + 1;

    const enemyTypes: EnemyType[] = [];

    for (let i = 0; i < amountOfTypesToSpawn; i++) {
      let randomTypeIndex = Math.floor(Math.random() * enemyTypesLength);
      let randomType =
        EnemyType[enemyTypesKeys[randomTypeIndex] as keyof typeof EnemyType];

      while (enemyTypes.includes(randomType)) {
        randomTypeIndex = Math.floor(Math.random() * enemyTypesLength);
        randomType = EnemyType[enemyTypesKeys[randomTypeIndex] as keyof typeof EnemyType];
      }

      enemyTypes.push(randomType);
    }

    return enemyTypes;
  }

  /** Creates a stage reward object and decides what the stage reward will be */
  private pickRandomReward(): StageReward {
    return new StageReward();
  }

  /** Stores the currently selected bed in order to easily retrieve its stage information
   * From the UI
   */
  public setSelectedBed(bed: Bed): void {
    this.selectedbed = bed;
    console.log("Selected bed is now: " + bed);
  }

  /** Returns information on the select bed */
  public getSelectedBedInformation(): {
    isProcedural: boolean;
    layout: FixedStageLayout | null;
    difficulty: number;
    enemies: EnemyType[];
    reward: StageReward;
  } {
    if (!this.selectedbed) {
      console.log('Stage manager tried to get selected bed information but no bed was selected');
      return {
        isProcedural: false,
        layout: FixedStageLayout.HUB,
        difficulty: 0,
        enemies: [],
        reward: new StageReward(),
      };
    }

    return {
      isProcedural: this.selectedbed.isStageProcedural,
      layout: this.selectedbed.proposedFixedStageLayout,
      difficulty: this.selectedbed.difficulty,
      enemies: this.selectedbed.enemyTypes,
      reward: this.selectedbed.stageReward,
    };

  }

  public enterStage(): void {
    if (!this.selectedbed) {
      return;
    }

    this.selectedbed.enterStage();
  }

}
