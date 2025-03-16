export interface ISaveable {
  save(): string;
  restoreSave(data: string): void;
  resetSave(): void;
}
