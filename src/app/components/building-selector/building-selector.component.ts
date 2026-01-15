import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { BuildingService } from '../../services/building.service';

@Component({
  selector: 'app-building-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="building-selector">
      <label class="selector-label">Building:</label>
      <select
        class="building-select"
        [value]="currentBuildingId() || ''"
        (change)="onBuildingChange($event)"
      >
        @if (!currentBuildingId()) {
          <option value="">Select a building</option>
        }
        @for (building of buildings(); track building.id) {
          <option [value]="building.id">{{ building.name }}</option>
        }
      </select>
    </div>
  `,
  styles: [`
    .building-selector {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .selector-label {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--color-text-secondary);
    }

    .building-select {
      padding: var(--spacing-sm) var(--spacing-md);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-md);
      background: var(--color-card-bg);
      color: var(--color-text-primary);
      font-size: 0.9rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 180px;
    }

    .building-select:hover {
      border-color: var(--color-primary-light);
    }

    .building-select:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
  `],
})
export class BuildingSelectorComponent {
  private buildingService = inject(BuildingService);

  buildings = this.buildingService.buildings;
  currentBuildingId = this.buildingService.currentBuildingId;

  onBuildingChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.buildingService.setCurrentBuilding(select.value || null);
  }
}
