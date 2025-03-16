import { ISaveable } from './saveable';

export class SaveManager {
  private saveables: ISaveable[] = [];

  public addSaveable(saveable: ISaveable): void {
    this.saveables.push(saveable);
  }

  public hasSave(): boolean {
    return !!localStorage.getItem('save');
  }

  /**
   * Save the data of all saveables to local storage
   */
  public save(): void {
    const data: { [key: string]: string } = {};

    this.saveables.forEach((saveable, index) => {
      data[`key${index}`] = saveable.save();
    });

    localStorage.setItem('save', JSON.stringify(data));
  }

  /**
   * Restore the data of all saveables from local storage
   */
  public restore(): void {
    const data = localStorage.getItem('save');

    if (data) {
      const parsedData = JSON.parse(data);

      this.saveables.forEach((saveable, index) => {
        saveable.restoreSave(parsedData[`key${index}`]);
      });
    }
  }

  public reset(): void {
    localStorage.removeItem('save');

    this.saveables.forEach((saveable) => {
      saveable.resetSave();
    });
  }
}
