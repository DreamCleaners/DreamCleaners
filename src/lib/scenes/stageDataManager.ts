import { StageData } from './stageData';
import data from '../../assets/data/stages.json' assert { type: 'json' };

export class StageDataManager {
  private static instance: StageDataManager;

  public static getInstance(): StageDataManager {
    if (!StageDataManager.instance) {
      StageDataManager.instance = new StageDataManager();
    }
    return StageDataManager.instance;
  }

  private constructor() {
    const stagesJson = data as Record<string, StageData>;
    for (const stageType in stagesJson) {
      const stageJson = stagesJson[stageType];
      this.stagesData.set(stageType, stageJson);
    }
  }

  private stagesData = new Map<string, StageData>();

  public getStageData(stageLayout: string): StageData {
    const stageData = this.stagesData.get(stageLayout);
    if (!stageData) {
      throw new Error(`Stage data not found for layout: ${stageLayout}`);
    }
    return stageData;
  }
}
