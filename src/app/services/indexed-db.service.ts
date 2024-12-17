import { Injectable } from '@angular/core';
import Dexie from 'dexie';

export interface DropdownState {
  id: number;
  selectedItems: { category: string; selected: string[] }[];
}

@Injectable({
  providedIn: 'root',
})
export class IndexedDbService extends Dexie {
  dropdownStates: Dexie.Table<DropdownState, number>;

  constructor() {
    super('DropdownDB');
    this.version(1).stores({
      dropdownStates: 'id',
    });
    this.dropdownStates = this.table('dropdownStates');
  }

  async saveState(state: DropdownState): Promise<void> {
    await this.dropdownStates.put(state);
  }

  async getState(id: number): Promise<DropdownState | undefined> {
    return await this.dropdownStates.get(id);
  }
}
