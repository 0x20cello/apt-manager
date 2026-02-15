import { Component, input, output, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Apartment, ApartmentMetrics } from '../../models/apartment.model';
import { ApartmentService } from '../../services/apartment.service';
import { MetricsCardComponent } from '../metrics-card/metrics-card.component';
import { RoomListComponent } from '../room-list/room-list.component';
import { ExpenseListComponent } from '../expense-list/expense-list.component';

@Component({
  selector: 'app-apartment-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MetricsCardComponent, RoomListComponent, ExpenseListComponent],
  template: `
    <article class="apartment-card">
      <header class="apartment-header">
        <div class="apartment-title-row">
          <input
            type="text"
            class="apartment-name-input"
            [value]="apartment().name"
            (blur)="onNameChange($event)"
            (keydown.enter)="blurTarget($event)"
          />
          <button class="btn-delete" (click)="onRemove()" title="Delete apartment">
            ✕
          </button>
        </div>
      </header>

      <div class="apartment-content">
        <section class="metrics-section">
          @let metrics = getMetrics();
          <div class="metrics-grid">
            <app-metrics-card
              label="Monthly Revenue"
              [value]="metrics.monthlyRevenue"
              type="revenue"
              [minValue]="metrics.minMonthlyRevenue"
              [maxValue]="metrics.maxMonthlyRevenue"
              [showRange]="true"
            />
            <app-metrics-card
              label="Yearly Revenue"
              [value]="metrics.yearlyRevenue"
              type="revenue"
              [minValue]="metrics.minYearlyRevenue"
              [maxValue]="metrics.maxYearlyRevenue"
              [showRange]="true"
            />
            <app-metrics-card
              label="Monthly Costs"
              [value]="metrics.monthlyCosts"
              type="costs"
            />
            <app-metrics-card
              label="Yearly Costs"
              [value]="metrics.yearlyCosts"
              type="costs"
            />
            <app-metrics-card
              label="Monthly Profit"
              [value]="metrics.monthlyProfit"
              type="profit"
              [isNegative]="metrics.monthlyProfit < 0"
              [minValue]="metrics.minMonthlyProfit"
              [maxValue]="metrics.maxMonthlyProfit"
              [showRange]="true"
            />
            <app-metrics-card
              label="Yearly Profit"
              [value]="metrics.yearlyProfit"
              type="profit"
              [isNegative]="metrics.yearlyProfit < 0"
              [minValue]="metrics.minYearlyProfit"
              [maxValue]="metrics.maxYearlyProfit"
              [showRange]="true"
            />
          </div>
        </section>

        <section class="rooms-section">
          <app-room-list
            [rooms]="apartment().rooms"
            [tenants]="apartment().tenants"
            (roomAdded)="onRoomAdded($event)"
            (roomUpdated)="onRoomUpdated($event)"
            (roomRemoved)="onRoomRemoved($event)"
          />
        </section>

        <section class="expenses-section">
          <app-expense-list
            [expenses]="apartment().expenses"
            (expenseAdded)="onExpenseAdded($event)"
            (expenseUpdated)="onExpenseUpdated($event)"
            (expenseRemoved)="onExpenseRemoved($event)"
          />
        </section>
      </div>
    </article>
  `,
  styles: [`
    .apartment-card {
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-xl);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      transition: all 0.3s ease;
    }

    .apartment-card:hover {
      border-color: var(--color-primary-light);
      box-shadow: var(--shadow-md);
    }

    .apartment-header {
      padding: var(--spacing-lg);
      background: var(--color-bg-secondary);
      border-bottom: 1px solid var(--color-border);
    }

    .apartment-title-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .apartment-name-input {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--color-text-primary);
      font-size: 1.5rem;
      font-weight: 600;
      font-family: inherit;
      padding: var(--spacing-xs);
      border-radius: var(--border-radius-sm);
      transition: all 0.2s ease;
    }

    .apartment-name-input:hover {
      background: var(--color-bg-tertiary);
    }

    .apartment-name-input:focus {
      outline: none;
      background: var(--color-bg-tertiary);
    }

    .btn-delete {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: var(--border-radius-md);
      background: rgba(239, 68, 68, 0.1);
      color: var(--color-error);
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-delete:hover {
      background: rgba(239, 68, 68, 0.2);
      transform: scale(1.05);
    }

    .apartment-content {
      padding: var(--spacing-lg);
    }

    .metrics-section {
      margin-bottom: var(--spacing-lg);
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-sm);
    }

    .rooms-section, .expenses-section {
      margin-top: var(--spacing-lg);
      padding-top: var(--spacing-lg);
      border-top: 1px solid var(--color-border);
    }

    @media (max-width: 768px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class ApartmentCardComponent {
  private apartmentService = inject(ApartmentService);

  apartment = input.required<Apartment>();
  apartmentUpdated = output<{ updates: Partial<Apartment> }>();
  apartmentRemoved = output<void>();

  getMetrics(): ApartmentMetrics {
    return this.apartmentService.calculateMetrics(this.apartment());
  }

  onNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.apartmentUpdated.emit({ updates: { name: input.value } });
  }

  onRemove(): void {
    this.apartmentRemoved.emit();
  }

  onRoomAdded(event: { name: string; rentMin: number; rentMax: number }): void {
    this.apartmentService.addRoom(this.apartment().id, {
      name: event.name,
      rentMin: event.rentMin,
      rentMax: event.rentMax,
      isTaken: false,
    });
  }

  onRoomUpdated(event: { id: string; updates: Partial<any> }): void {
    this.apartmentService.updateRoom(this.apartment().id, event.id, event.updates);
  }

  onRoomRemoved(roomId: string): void {
    this.apartmentService.removeRoom(this.apartment().id, roomId);
  }

  onExpenseAdded(event: { name: string; amount: number; cadence: any }): void {
    this.apartmentService.addExpense(this.apartment().id, event);
  }

  onExpenseUpdated(event: { id: string; updates: Partial<any> }): void {
    this.apartmentService.updateExpense(this.apartment().id, event.id, event.updates);
  }

  onExpenseRemoved(expenseId: string): void {
    this.apartmentService.removeExpense(this.apartment().id, expenseId);
  }

  blurTarget(event: Event): void {
    (event.target as HTMLElement).blur();
  }
}
