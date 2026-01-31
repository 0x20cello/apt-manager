import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApartmentService } from '../../services/apartment.service';
import { Tenant } from '../../models/apartment.model';

interface TenantBill {
  tenant: Tenant;
  days: number;
  amount: number;
}

@Component({
  selector: 'app-bill-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="bill-calculator-page">
      <div class="page-header">
        <h1>Bill Calculator</h1>
        <p class="page-subtitle">Calculate bill distribution based on tenant occupancy</p>
      </div>

      @if (!currentApartment()) {
        <div class="empty-state">
          <div class="empty-icon">💰</div>
          <h3>No apartment selected</h3>
          <p>Select an apartment from the dropdown above to calculate bills</p>
        </div>
      } @else {
        <div class="bill-calculator-content">
          <div class="calculator-form">
            <div class="form-group">
              <label for="billTotal">Bill Total (AED)</label>
              <input
                type="number"
                id="billTotal"
                [(ngModel)]="billTotal"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>

            <div class="form-group">
              <label for="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                [(ngModel)]="startDate"
              />
            </div>

            <div class="form-group">
              <label for="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                [(ngModel)]="endDate"
              />
            </div>
          </div>

          @if (billTotal() > 0 && startDate() && endDate()) {
            <div class="calculation-results">
              <div class="summary-card">
                <h3>Summary</h3>
                <div class="summary-item">
                  <span class="summary-label">Total Days of Presence:</span>
                  <span class="summary-value">{{ totalDaysOfPresence() }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Cost per Day:</span>
                  <span class="summary-value">{{ formatCurrency(costPerDay()) }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Bill Total:</span>
                  <span class="summary-value">{{ formatCurrency(billTotal()) }}</span>
                </div>
              </div>

              <div class="tenants-list">
                <h3>Tenant Breakdown</h3>
                @if (tenantBills().length === 0) {
                  <p class="no-tenants">No tenants with presence in this period</p>
                } @else {
                  <div class="tenant-bills">
                    @for (bill of tenantBills(); track bill.tenant.id) {
                      <div class="tenant-bill-item">
                        <div class="tenant-info">
                          <span class="tenant-name">{{ bill.tenant.name }}</span>
                          <span class="tenant-days">{{ bill.days }} day{{ bill.days !== 1 ? 's' : '' }}</span>
                        </div>
                        <div class="tenant-amount">
                          {{ formatCurrency(bill.amount) }}
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .bill-calculator-page {
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

    .bill-calculator-content {
      max-width: 800px;
    }

    .calculator-form {
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-lg);
      padding: var(--spacing-lg);
      margin-bottom: var(--spacing-xl);
    }

    .form-group {
      margin-bottom: var(--spacing-md);
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: var(--spacing-xs);
    }

    .form-group input {
      width: 100%;
      padding: var(--spacing-sm) var(--spacing-md);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-md);
      background: var(--color-card-bg);
      color: var(--color-text-primary);
      font-size: 0.9rem;
      font-family: inherit;
      transition: all 0.2s ease;
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .calculation-results {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .summary-card {
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-lg);
      padding: var(--spacing-lg);
    }

    .summary-card h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-md) 0;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm) 0;
      border-bottom: 1px solid var(--color-border);
    }

    .summary-item:last-child {
      border-bottom: none;
    }

    .summary-label {
      font-size: 0.9rem;
      color: var(--color-text-secondary);
    }

    .summary-value {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .tenants-list {
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-lg);
      padding: var(--spacing-lg);
    }

    .tenants-list h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-md) 0;
    }

    .no-tenants {
      color: var(--color-text-secondary);
      text-align: center;
      padding: var(--spacing-md);
      margin: 0;
    }

    .tenant-bills {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .tenant-bill-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-md);
    }

    .tenant-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .tenant-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .tenant-days {
      font-size: 0.85rem;
      color: var(--color-text-secondary);
    }

    .tenant-amount {
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-primary);
    }

    @media (max-width: 768px) {
      .bill-calculator-page {
        padding: var(--spacing-md);
        padding-left: max(var(--spacing-md), env(safe-area-inset-left));
        padding-right: max(var(--spacing-md), env(safe-area-inset-right));
      }

      .page-header h1 {
        font-size: 1.5rem;
      }

      .form-group input {
        min-height: 44px;
      }
    }
  `],
})
export class BillCalculatorComponent {
  private apartmentService = inject(ApartmentService);

  currentApartment = this.apartmentService.currentApartment;

  private today = new Date();
  private thirtyDaysAgo: Date;

  billTotal = signal(0);
  startDate = signal('');
  endDate = signal('');

  constructor() {
    this.thirtyDaysAgo = new Date(this.today);
    this.thirtyDaysAgo.setDate(this.thirtyDaysAgo.getDate() - 30);
    this.startDate.set(this.formatDateInput(this.thirtyDaysAgo));
    this.endDate.set(this.formatDateInput(this.today));
  }

  totalDaysOfPresence = computed(() => {
    const apartment = this.currentApartment();
    if (!apartment) return 0;

    const start = this.parseDate(this.startDate());
    const end = this.parseDate(this.endDate());
    if (!start || !end || end < start) return 0;

    let totalDays = 0;

    for (const tenant of apartment.tenants) {
      totalDays += this.calculateTenantPresenceDays(tenant, start, end);
    }

    return totalDays;
  });

  costPerDay = computed(() => {
    const total = this.totalDaysOfPresence();
    const bill = this.billTotal();
    if (total === 0 || bill === 0) return 0;
    return bill / total;
  });

  tenantBills = computed(() => {
    const apartment = this.currentApartment();
    if (!apartment) return [];

    const start = this.parseDate(this.startDate());
    const end = this.parseDate(this.endDate());
    if (!start || !end || end < start) return [];

    const costPerDayValue = this.costPerDay();
    const bills: TenantBill[] = [];

    for (const tenant of apartment.tenants) {
      const days = this.calculateTenantPresenceDays(tenant, start, end);
      if (days > 0) {
        bills.push({
          tenant,
          days,
          amount: days * costPerDayValue,
        });
      }
    }

    return bills.sort((a, b) => b.amount - a.amount);
  });

  private calculateTenantPresenceDays(tenant: Tenant, start: Date, end: Date): number {
    const tenantStart = tenant.startDate ? new Date(tenant.startDate) : null;
    const tenantEnd = tenant.endDate ? new Date(tenant.endDate) : null;

    const effectiveStart = tenantStart && tenantStart > start ? tenantStart : start;
    const effectiveEnd = tenantEnd && tenantEnd < end ? tenantEnd : end;

    if (effectiveStart > effectiveEnd) return 0;

    const disabledDatesSet = new Set(tenant.disabledDates || []);
    let days = 0;
    const current = new Date(effectiveStart);

    while (current <= effectiveEnd) {
      const dateStr = this.formatDate(current);
      if (!disabledDatesSet.has(dateStr)) {
        days++;
      }
      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private formatDateInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    return new Date(dateStr + 'T00:00:00');
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
