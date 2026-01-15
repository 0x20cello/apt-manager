import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Expense, ExpenseCadence } from '../../models/apartment.model';

@Component({
  selector: 'app-expense-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="section-header">
      <h3>Expenses</h3>
      <button class="btn-add-small" (click)="showAddForm.set(true)">+ Add Expense</button>
    </div>

    @if (showAddForm()) {
      <div class="add-form">
        <input type="text" [(ngModel)]="newExpenseName" placeholder="Expense name" />
        <div class="expense-inputs">
          <input type="number" [(ngModel)]="newExpenseAmount" placeholder="Amount" min="0" />
          <select [(ngModel)]="newExpenseCadence">
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div class="form-actions">
          <button class="btn-confirm" (click)="handleAdd()">Add</button>
          <button class="btn-cancel" (click)="showAddForm.set(false)">Cancel</button>
        </div>
      </div>
    }

    @if (expenses().length === 0) {
      <p class="empty-list">No expenses added yet</p>
    } @else {
      <div class="expenses-list">
        @for (expense of expenses(); track expense.id) {
          <div class="expense-item">
            <div class="expense-info">
              <input
                type="text"
                class="inline-edit"
                [value]="expense.name"
                (blur)="onExpenseNameChange(expense.id, $event)"
                (keydown.enter)="blurTarget($event)"
              />
              <div class="expense-amount">
                <input
                  type="number"
                  class="inline-number"
                  [value]="expense.amount"
                  (blur)="onAmountChange(expense.id, $event)"
                  (keydown.enter)="blurTarget($event)"
                  min="0"
                />
                <select
                  [value]="expense.cadence"
                  (change)="onCadenceChange(expense.id, $event)"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            <button class="btn-delete-small" (click)="onRemove(expense.id)">✕</button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
    }

    .section-header h3 {
      color: var(--color-text-primary);
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
    }

    .btn-add-small {
      padding: var(--spacing-sm) var(--spacing-md);
      border: 1px solid var(--color-primary-light);
      border-radius: var(--border-radius-md);
      background: transparent;
      color: var(--color-primary);
      font-size: 0.85rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-add-small:hover {
      background: var(--color-primary-lighter);
      background-opacity: 0.1;
      border-color: var(--color-primary);
    }

    .add-form {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-primary-light);
      border-radius: var(--border-radius-lg);
      padding: var(--spacing-md);
      margin-bottom: var(--spacing-md);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .add-form input, .add-form select {
      padding: var(--spacing-sm);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-md);
      background: var(--color-card-bg);
      color: var(--color-text-primary);
      font-size: 0.9rem;
      font-family: inherit;
      transition: all 0.2s ease;
    }

    .add-form input:focus, .add-form select:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .add-form input::placeholder {
      color: var(--color-text-tertiary);
    }

    .expense-inputs {
      display: flex;
      gap: var(--spacing-sm);
      align-items: center;
    }

    .expense-inputs input {
      flex: 1;
    }

    .expense-inputs select {
      width: 120px;
    }

    .form-actions {
      display: flex;
      gap: var(--spacing-sm);
      justify-content: flex-end;
    }

    .btn-confirm {
      padding: var(--spacing-sm) var(--spacing-md);
      border: none;
      border-radius: var(--border-radius-md);
      background: var(--color-primary);
      color: white;
      font-size: 0.85rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-confirm:hover {
      background: var(--color-primary-dark);
      transform: translateY(-1px);
    }

    .btn-cancel {
      padding: var(--spacing-sm) var(--spacing-md);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-md);
      background: transparent;
      color: var(--color-text-secondary);
      font-size: 0.85rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-cancel:hover {
      border-color: var(--color-border-light);
      color: var(--color-text-primary);
    }

    .empty-list {
      color: var(--color-text-tertiary);
      font-size: 0.9rem;
      text-align: center;
      padding: var(--spacing-md);
      margin: 0;
    }

    .expenses-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .expense-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-lg);
      transition: all 0.2s ease;
    }

    .expense-item:hover {
      background: var(--color-bg-secondary);
    }

    .expense-info {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      flex: 1;
    }

    .inline-edit {
      background: transparent;
      border: none;
      color: var(--color-text-primary);
      font-size: 0.95rem;
      font-weight: 500;
      font-family: inherit;
      padding: var(--spacing-xs);
      border-radius: var(--border-radius-sm);
      width: 100%;
      transition: all 0.2s ease;
    }

    .inline-edit:hover {
      background: var(--color-bg-secondary);
    }

    .inline-edit:focus {
      outline: none;
      background: var(--color-bg-secondary);
    }

    .expense-amount {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      color: var(--color-text-secondary);
      font-size: 0.85rem;
    }

    .inline-number {
      width: 70px;
      background: transparent;
      border: none;
      color: var(--color-text-secondary);
      font-size: 0.85rem;
      font-family: 'JetBrains Mono', monospace;
      padding: var(--spacing-xs);
      border-radius: var(--border-radius-sm);
      transition: all 0.2s ease;
    }

    .inline-number:hover {
      background: var(--color-bg-secondary);
    }

    .inline-number:focus {
      outline: none;
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
    }

    .inline-number::-webkit-inner-spin-button,
    .inline-number::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .expense-amount select {
      padding: var(--spacing-xs) var(--spacing-sm);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-sm);
      background: var(--color-card-bg);
      color: var(--color-text-secondary);
      font-size: 0.8rem;
      font-family: inherit;
      cursor: pointer;
    }

    .expense-amount select:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .btn-delete-small {
      width: 28px;
      height: 28px;
      border: none;
      border-radius: var(--border-radius-sm);
      background: transparent;
      color: var(--color-text-tertiary);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-delete-small:hover {
      background: rgba(239, 68, 68, 0.1);
      color: var(--color-error);
    }
  `],
})
export class ExpenseListComponent {
  expenses = input.required<Expense[]>();
  expenseAdded = output<{ name: string; amount: number; cadence: ExpenseCadence }>();
  expenseUpdated = output<{ id: string; updates: Partial<Omit<Expense, 'id'>> }>();
  expenseRemoved = output<string>();

  showAddForm = signal(false);
  newExpenseName = signal('');
  newExpenseAmount = signal(0);
  newExpenseCadence = signal<ExpenseCadence>('monthly');

  handleAdd(): void {
    const name = this.newExpenseName().trim();
    if (name) {
      this.expenseAdded.emit({
        name,
        amount: this.newExpenseAmount(),
        cadence: this.newExpenseCadence(),
      });
      this.newExpenseName.set('');
      this.newExpenseAmount.set(0);
      this.newExpenseCadence.set('monthly');
      this.showAddForm.set(false);
    }
  }

  onExpenseNameChange(id: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.expenseUpdated.emit({ id, updates: { name: input.value } });
  }

  onAmountChange(id: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.expenseUpdated.emit({ id, updates: { amount: +input.value } });
  }

  onCadenceChange(id: string, event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.expenseUpdated.emit({ id, updates: { cadence: select.value as ExpenseCadence } });
  }

  onRemove(id: string): void {
    this.expenseRemoved.emit(id);
  }

  blurTarget(event: Event): void {
    (event.target as HTMLElement).blur();
  }
}
