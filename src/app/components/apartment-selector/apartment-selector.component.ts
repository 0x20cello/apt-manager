import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ApartmentService } from '../../services/apartment.service';

@Component({
  selector: 'app-apartment-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="apartment-selector">
      <label class="selector-label">Apartment:</label>
      <select
        class="apartment-select"
        [value]="currentApartmentId() || ''"
        (change)="onApartmentChange($event)"
      >
        @if (!currentApartmentId()) {
          <option value="">Select an apartment</option>
        }
        @for (apartment of apartments(); track apartment.id) {
          <option [value]="apartment.id">{{ apartment.name }}</option>
        }
      </select>
    </div>
  `,
  styles: [`
    .apartment-selector {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .selector-label {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--color-text-secondary);
    }

    .apartment-select {
      padding: var(--spacing-sm) var(--spacing-md);
      min-height: 44px;
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

    @media (max-width: 768px) {
      .apartment-selector {
        width: 100%;
      }

      .apartment-select {
        flex: 1;
        min-width: 0;
      }
    }

    .apartment-select:hover {
      border-color: var(--color-primary-light);
    }

    .apartment-select:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
  `],
})
export class ApartmentSelectorComponent {
  private apartmentService = inject(ApartmentService);

  apartments = this.apartmentService.apartments;
  currentApartmentId = this.apartmentService.currentApartmentId;

  onApartmentChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.apartmentService.setCurrentApartment(select.value || null);
  }
}
