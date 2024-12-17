import { Component, HostListener, OnInit } from '@angular/core';
import { DropdownState, IndexedDbService } from '../../services/indexed-db.service';
import { NgForOf, NgIf } from '@angular/common';

interface Funnel {
  name: string;
  stages: Stage[];
  expanded: boolean;
}

interface Stage {
  name: string;
  color: string;
}

@Component({
  selector: 'app-dropdown-list',
  templateUrl: './dropdown-list.component.html',
  styleUrls: ['./dropdown-list.component.scss'],
  imports: [
    NgIf,
    NgForOf
  ],
  standalone: true
})
export class DropdownListComponent implements OnInit {
  isOpen = false; // Открыт ли дропдаун
  dropdownLabel = 'Выбрать элементы';
  selectedItems: { [key: string]: Set<string> } = {};

  funnels: Funnel[] = [
    { name: 'Продажи', stages: this.createStages(), expanded: false },
    { name: 'Сотрудники', stages: this.createStages(), expanded: false },
    { name: 'Партнеры', stages: this.createStages(), expanded: false },
    { name: 'Ивент', stages: this.createStages(), expanded: false },
    { name: 'Входящие обращения', stages: this.createStages(), expanded: false },
  ];

  constructor(private dbService: IndexedDbService) {}

  ngOnInit() {
    this.loadState();
  }

  createStages(): Stage[] {
    return [
      { name: 'Неразобранное', color: '#99CCFD' },
      { name: 'Переговоры', color: '#FFFF99' },
      { name: 'Принимают решение', color: '#FFCC66' },
      { name: 'Успешно', color: '#CCFF66' },
    ];
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.updateLabel();
    }
  }

  toggleFunnel(funnel: Funnel) {
    funnel.expanded = !funnel.expanded;
  }

  toggleFunnelSelection(funnel: Funnel) {
    const funnelSelected = this.isFunnelSelected(funnel);
    if (funnelSelected) {
      funnel.stages.forEach((stage) => this.removeSelection(funnel.name, stage.name));
    } else {
      funnel.stages.forEach((stage) => this.addSelection(funnel.name, stage.name));
    }
    this.updateLabel();
    this.saveState();
  }

  addSelection(funnel: string, stage: string) {
    if (!this.selectedItems[funnel]) this.selectedItems[funnel] = new Set();
    this.selectedItems[funnel].add(stage);
    this.updateLabel();
    this.saveState();
  }

  removeSelection(funnel: string, stage: string) {
    this.selectedItems[funnel]?.delete(stage);
    if (this.selectedItems[funnel]?.size === 0) delete this.selectedItems[funnel];
    this.updateLabel();
    this.saveState();
  }

  isSelected(funnel: string, stage: string): boolean {
    return this.selectedItems[funnel]?.has(stage) || false;
  }

  isFunnelSelected(funnel: Funnel): boolean {
    return funnel.stages.every((stage) => this.isSelected(funnel.name, stage.name));
  }

  toggleSelectAll() {
    if (this.hasAnySelection()) {
      this.selectedItems = {};
      this.updateLabel();
    } else {
      this.funnels.forEach((funnel) => {
        funnel.stages.forEach((stage) => this.addSelection(funnel.name, stage.name));
      });
    }
    this.updateLabel();
    this.saveState();
  }

  hasAnySelection(): boolean {
    return Object.values(this.selectedItems).some((set) => set.size > 0);
  }

  updateLabel() {
    const funnelCount = Object.keys(this.selectedItems).length;
    const stageCount = Object.values(this.selectedItems).reduce((sum, set) => sum + set.size, 0);

    // Определяем падежные окончания
    const funnelText = this.getGrammaticalCase(funnelCount, 'воронка', 'воронки', 'воронок');
    const stageText = this.getGrammaticalCase(stageCount, 'этап', 'этапа', 'этапов');

    if (funnelCount === 0 && stageCount === 0) {
      this.dropdownLabel = "Выбрать элементы";
    } else {
      this.dropdownLabel = `${funnelCount} ${funnelText}, ${stageCount} ${stageText}`;
    }
  }

  getGrammaticalCase(count: number, singular: string, plural: string, genitivePlural: string): string {
    if (count % 10 === 1 && count % 100 !== 11) {
      return singular;
    } else if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
      return plural;
    } else {
      return genitivePlural;
    }
  }


  async loadState() {
    const state = await this.dbService.getState(1);
    if (state) {
      this.selectedItems = {};
      state.selectedItems.forEach((item) => {
        this.selectedItems[item.category] = new Set(item.selected);
      });
    }
    this.updateLabel();
  }

  async saveState() {
    const dropdownState: DropdownState = {
      id: 1,
      selectedItems: Object.entries(this.selectedItems).map(([category, set]) => ({
        category,
        selected: Array.from(set),
      })),
    };

    await this.dbService.saveState(dropdownState);
  }


  @HostListener('document:click', ['$event'])
  onOutsideClick(event: Event) {
    if (!(event.target as HTMLElement).closest('.dropdown-container')) {
      this.isOpen = false;
      this.updateLabel();
    }
  }
}
