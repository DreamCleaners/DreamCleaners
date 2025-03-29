import { EnemyType } from '../enemies/enemyType';
import { Bed } from '../interactiveElements/bed';
import { ISaveable } from '../saveable';
import { FixedStageLayout } from '../scenes/fixedStageLayout';
import { SerializedStageInformation } from './serializedStageInformation';
import { StageInformation } from './stageInformation';
import { StageReward } from './stageReward';

/** The purpose of this class is to manage proposed stages to the player, the stage rewards and so on */
export class StagesManager implements ISaveable {
  private static _instance: StagesManager;
  private selectedbed!: Bed;

  private previouslyProposedStages: StageInformation[] = [];
  private mustLoadPreviousStages: boolean = false;

  private constructor() {}

  public static getInstance(): StagesManager {
    if (!StagesManager._instance) {
      StagesManager._instance = new StagesManager();
    }
    return StagesManager._instance;
  }

  /** Based on current run's progress, will edit each bed of the HUB so they propose various stages */
  public setProposedStagesForBeds(beds: Bed[], runProgession: number): void {
    if (this.mustLoadPreviousStages) {
      if (this.previouslyProposedStages.length !== beds.length) {
        console.log(
          'An anomaly occured, the amount of beds and the amount of stored stages infos do not match',
        );
        this.mustLoadPreviousStages = false;
        return;
      }
      // In that case we load our previously proposed stages infos into the beds
      for (let i = 0; i < beds.length; i++) {
        const stageInfo = this.previouslyProposedStages[i];
        beds[i].setStageInfo({
          isProcedural: stageInfo.isStageProcedural,
          layout: stageInfo.proposedFixedStageLayout as FixedStageLayout,
          difficulty: stageInfo.difficulty,
          enemies: stageInfo.enemyTypes,
          reward: stageInfo.stageReward,
        });
      }

      this.mustLoadPreviousStages = false;
      return;
    }

    this.previouslyProposedStages = [];

    const n = beds.length;

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
      const reward = this.pickRandomReward(runProgession);
      const difficultyFactor = this.pickDifficulty(reward, runProgession);
      const enemyTypes = this.pickRandomEnemyTypes();

      // Currently only proposes fixed stages
      // If we want to add procedural stages, we will need to add a logic of choosing
      // between fixed and procedural stages and adapting our stage info
      const layout = this.pickRandomFixedLayout(alreadyPickedFixedLayouts);
      alreadyPickedFixedLayouts.add(layout);

      // For now only fixed stages are implemented
      bed.setStageInfo({
        isProcedural: false, // For now only fixed stages are implemented
        layout: layout,
        difficulty: difficultyFactor,
        enemies: enemyTypes,
        reward: reward,
      });

      // We also store the stage information for saving purposes
      this.previouslyProposedStages.push(bed.stageInfo);
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

  private pickDifficulty(stageReward: StageReward, runProgress: number): number {
    // Base difficulty is random between 1 and 2
    let difficulty = Math.floor(Math.random() * 2) + 1;

    // Adjust difficulty based on the rarity of the weapon reward
    const weaponReward = stageReward.getWeaponReward();

    if (weaponReward) {
      difficulty += 1 + weaponReward.rarity;
    }

    // Add 1 to the difficulty every 2 stages completed
    difficulty += Math.floor(runProgress / 2);
    return difficulty;
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
  private pickRandomReward(runProgession: number): StageReward {
    return new StageReward(runProgession);
  }

  /** Stores the currently selected bed in order to easily retrieve its stage information
   * From the UI
   */
  public setSelectedBed(bed: Bed): void {
    this.selectedbed = bed;
  }

  /** Returns information on the select bed */
  public getSelectedBedInformation(): StageInformation {
    if (!this.selectedbed) {
      throw new Error(
        'Stage manager tried to get selected bed information but no bed was selected',
      );
    }

    return this.selectedbed.stageInfo;
  }

  public enterStage(): void {
    if (!this.selectedbed) {
      return;
    }

    this.selectedbed.enterStage();
  }

  // SAVE RELATED ---------
  // -----------------------------------------------------------

  save(): string {
    // Custom serialization of the stage information because json stringify does not work with undefined values
    const serializedStages: SerializedStageInformation[] =
      this.previouslyProposedStages.map((stage) => ({
        isStageProcedural: stage.isStageProcedural,
        proposedFixedStageLayout: stage.proposedFixedStageLayout,
        difficulty: stage.difficulty,
        enemyTypes: stage.enemyTypes,
        stageReward: {
          moneyReward: stage.stageReward.getMoneyReward(),
          weaponReward: stage.stageReward.getWeaponReward() || null, // Explicitly store null if undefined
        },
      }));

    return JSON.stringify(serializedStages);
  }

  restoreSave(data: string): void {
    const parsedData: SerializedStageInformation[] = JSON.parse(data);

    this.previouslyProposedStages = parsedData.map((stage) => {
      const stageReward = new StageReward(0);
      stageReward['moneyReward'] = stage.stageReward.moneyReward;
      stageReward['weaponReward'] = stage.stageReward.weaponReward || undefined; // Back to undefined

      return new StageInformation(
        stage.isStageProcedural,
        stage.proposedFixedStageLayout,
        stage.difficulty,
        stage.enemyTypes,
        stageReward,
      );
    });
  }

  resetSave(): void {
    this.previouslyProposedStages = [];
  }

  public start(isNewGame: boolean) {
    if (!isNewGame) {
      this.mustLoadPreviousStages = true;
      return;
    }
  }
}
