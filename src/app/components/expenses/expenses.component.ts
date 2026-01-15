import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ApartmentService } from '../../services/apartment.service';
import { ExpenseListComponent } from '../expense-list/expense-list.component';

@Component({
  selector: 'app-expenses',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExpenseListComponent],
  template: `
    <div class="expenses-page">
      <div class="page-header">
        <h1>Expenses</h1>
        <p class="page-subtitle">Manage expenses for {{ currentApartment()?.name || 'selected apartment' }}</p>
      </div>

      @if (!currentApartment()) {
        <div class="empty-state">
          <div class="empty-icon">💼</div>
          <h3>No apartment selected</h3>
          <p>Select an apartment from the dropdown above to manage expenses</p>
        </div>
      } @else {
        <div class="expenses-content">
          <app-expense-list
            [expenses]="currentApartment()!.expenses"
            (expenseAdded)="onExpenseAdded($event)"
            (expenseUpdated)="onExpenseUpdated($event)"
            (expenseRemoved)="onExpenseRemoved($event)"
          />
        </div>
      }
    </div>
  `,
  styles: [`
    .expenses-page {
      padding: var(--spacing-xl);
      min-height: 100%;
    }

    .page-header {
      margin-bottom: var(--spacing-xl);
    }

    .page-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-sm) 0;
    }

    .page-subtitle {
      color: var(--color-text-secondary);
      margin: 0;
    }

    .empty-state {
      text-align: center;
      padding: var(--spacing-2xl) var(--spacing-xl);
      color: var(--color-text-secondary);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: var(--spacing-lg);
      opacity: 0.5;
    }

    .empty-state h3 {
      font-size: 1.5rem;
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-sm) 0;
    }

    .empty-state p {
      margin: 0;
      color: var(--color-text-secondary);
    }

    .expenses-content {
      max-width: 800px;
    }
  `],
})
export class ExpensesComponent {
  private apartmentService = inject(ApartmentService);

  currentApartment = this.apartmentService.currentApartment;

  onExpenseAdded(event: { name: string; amount: number; cadence: any }): void {
    const apartment = this.currentApartment();
    if (!apartment) return;
    this.apartmentService.addExpense(apartment.id, event);
  }

  onExpenseUpdated(event: { id: string; updates: Partial<any> }): void {
    const apartment = this.currentApartment();
    if (!apartment) return;
    this.apartmentService.updateExpense(apartment.id, event.id, event.updates);
  }

  onExpenseRemoved(expenseId: string): void {
    const apartment = this.currentApartment();
    if (!apartment) return;
    this.apartmentService.removeExpense(apartment.id, expenseId);
  }
}
