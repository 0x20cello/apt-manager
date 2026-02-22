import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApartmentService } from '../../services/apartment.service';
import { Tenant, Room } from '../../models/apartment.model';
import { parseYmdDate } from '../../utils/tenant-occupancy.util';

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

            @if (rooms().length > 0) {
              <div class="form-group">
                <label>Rooms</label>
                <div class="room-filters">
                  @for (room of rooms(); track room.id) {
                    <button
                      class="room-chip"
                      [class.excluded]="excludedRoomIds().has(room.id)"
                      (click)="toggleRoom(room.id)"
                    >
                      {{ room.name }}
                    </button>
                  }
                </div>
              </div>
            }
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
                <div class="summary-actions">
                  <button class="btn-copy" (click)="copyCalculatorAsText()">
                    Copy as TXT
                  </button>
                  @if (copyState() === 'success') {
                    <span class="copy-feedback success">Copied</span>
                  } @else if (copyState() === 'error') {
                    <span class="copy-feedback error">Copy failed</span>
                  }
                  <button
                    class="btn-create-payments"
                    (click)="createPayments()"
                    [disabled]="tenantBills().length === 0"
                  >
                    Create Payments
                  </button>
                  @if (paymentsState() === 'success') {
                    <span class="copy-feedback success">Created</span>
                  }
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

    .room-filters {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }

    .room-chip {
      padding: var(--spacing-xs) var(--spacing-md);
      border: 1px solid var(--color-primary-light);
      border-radius: var(--border-radius-md);
      background: rgba(37, 99, 235, 0.08);
      color: var(--color-primary);
      font-size: 0.85rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .room-chip:hover {
      background: rgba(37, 99, 235, 0.15);
    }

    .room-chip.excluded {
      background: transparent;
      border-color: var(--color-border);
      color: var(--color-text-tertiary);
      text-decoration: line-through;
    }

    .room-chip.excluded:hover {
      border-color: var(--color-border-light);
      color: var(--color-text-secondary);
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

    .summary-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-top: var(--spacing-md);
    }

    .btn-copy {
      padding: var(--spacing-xs) var(--spacing-sm);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-md);
      background: var(--color-card-bg);
      color: var(--color-text-primary);
      font-size: 0.85rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-copy:hover {
      border-color: var(--color-primary);
      background: var(--color-bg-secondary);
    }

    .btn-create-payments {
      padding: var(--spacing-xs) var(--spacing-sm);
      border: 1px solid var(--color-primary-light);
      border-radius: var(--border-radius-md);
      background: var(--color-primary);
      color: white;
      font-size: 0.85rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-left: auto;
    }

    .btn-create-payments:hover:not(:disabled) {
      background: var(--color-primary-dark);
    }

    .btn-create-payments:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .copy-feedback {
      font-size: 0.8rem;
      font-weight: 600;
    }

    .copy-feedback.success {
      color: var(--color-success);
    }

    .copy-feedback.error {
      color: var(--color-error);
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
  copyState = signal<'idle' | 'success' | 'error'>('idle');
  paymentsState = signal<'idle' | 'success'>('idle');
  excludedRoomIds = signal<Set<string>>(new Set());

  rooms = computed(() => this.currentApartment()?.rooms ?? []);

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

    const excluded = this.excludedRoomIds();
    let totalDays = 0;

    for (const tenant of apartment.tenants) {
      if (excluded.has(tenant.roomId)) continue;
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

    const excluded = this.excludedRoomIds();
    const costPerDayValue = this.costPerDay();
    const bills: TenantBill[] = [];

    for (const tenant of apartment.tenants) {
      if (excluded.has(tenant.roomId)) continue;
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
    const tenantStart = tenant.startDate ? parseYmdDate(tenant.startDate) : null;
    const tenantEnd = tenant.endDate ? parseYmdDate(tenant.endDate) : null;

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

  toggleRoom(roomId: string): void {
    this.excludedRoomIds.update((set) => {
      const next = new Set(set);
      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        next.add(roomId);
      }
      return next;
    });
  }

  createPayments(): void {
    const apartment = this.currentApartment();
    if (!apartment) return;

    const bills = this.tenantBills();
    if (bills.length === 0) return;

    const end = this.parseDate(this.endDate());
    if (!end) return;

    const month = end.getMonth();
    const year = end.getFullYear();

    this.apartmentService.addBillPayments(
      apartment.id,
      bills.map((b) => ({ tenantId: b.tenant.id, amount: b.amount })),
      month,
      year,
    );

    this.paymentsState.set('success');
    window.setTimeout(() => this.paymentsState.set('idle'), 2000);
  }

  async copyCalculatorAsText(): Promise<void> {
    const text = this.getCalculatorText();
    if (!text) {
      this.copyState.set('error');
      this.clearCopyStateLater();
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        this.copyWithFallback(text);
      }
      this.copyState.set('success');
    } catch {
      this.copyState.set('error');
    }
    this.clearCopyStateLater();
  }

  private getCalculatorText(): string {
    const apartment = this.currentApartment();
    if (!apartment) {
      return '';
    }

    const lines: string[] = [];
    lines.push(`Apartment: ${apartment.name}`);
    lines.push('');
    lines.push('Input');
    lines.push(`- Bill Total: ${this.formatCurrency(this.billTotal())}`);
    lines.push(`- Start Date: ${this.startDate() || 'N/A'}`);
    lines.push(`- End Date: ${this.endDate() || 'N/A'}`);
    lines.push('');
    lines.push('Output');
    lines.push(`- Total Days of Presence: ${this.totalDaysOfPresence()}`);
    lines.push(`- Cost per Day: ${this.formatCurrency(this.costPerDay())}`);
    lines.push(`- Bill Total: ${this.formatCurrency(this.billTotal())}`);
    lines.push('');
    lines.push('Tenant Breakdown');
    const bills = this.tenantBills();
    if (bills.length === 0) {
      lines.push('- No tenants with presence in this period');
    } else {
      for (const bill of bills) {
        lines.push(`- ${bill.tenant.name}: ${bill.days} day${bill.days !== 1 ? 's' : ''} - ${this.formatCurrency(bill.amount)}`);
      }
    }
    return lines.join('\n');
  }

  private copyWithFallback(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  private clearCopyStateLater(): void {
    window.setTimeout(() => this.copyState.set('idle'), 2000);
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
