import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { Payment, Tenant, Room } from '../../models/apartment.model';

export type PaymentStatus = 'paid' | 'due' | 'overdue';

@Component({
  selector: 'app-payment-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (payments().length === 0) {
      <p class="empty-list">No payments for this month</p>
    } @else {
      <div class="payments-list">
        @for (item of enrichedPayments(); track item.payment.id) {
          <div class="payment-item" [class.paid]="item.status === 'paid'" [class.overdue]="item.status === 'overdue'">
            <button
              class="pay-toggle"
              [class.checked]="item.status === 'paid'"
              (click)="paymentToggled.emit(item.payment.id)"
              [attr.aria-label]="item.status === 'paid' ? 'Mark as unpaid' : 'Mark as paid'"
            >
              @if (item.status === 'paid') {
                <span class="check-icon">✓</span>
              }
            </button>
            <div class="payment-details">
              <div class="payment-primary">
                <span class="type-badge" [class]="'type-' + item.payment.type">{{ item.payment.type }}</span>
                <span class="room-name">{{ item.roomName }}</span>
                <span class="tenant-name">{{ item.tenantName }}</span>
              </div>
              <div class="payment-secondary">
                <span class="due-date">Due: {{ item.dueDateFormatted }}</span>
                @if (item.payment.paidDate) {
                  <span class="paid-date">Paid: {{ item.paidDateFormatted }}</span>
                }
              </div>
            </div>
            <div class="payment-right">
              <span class="payment-amount">{{ item.amountFormatted }}</span>
              <span class="status-badge" [class]="'status-' + item.status">{{ item.status }}</span>
            </div>
            <button class="btn-delete" (click)="paymentRemoved.emit(item.payment.id)" aria-label="Delete payment">✕</button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .empty-list {
      color: var(--color-text-tertiary);
      font-size: 0.9rem;
      text-align: center;
      padding: var(--spacing-xl);
      margin: 0;
    }

    .payments-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .payment-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-lg);
      transition: all 0.2s ease;
    }

    .payment-item:hover {
      background: var(--color-bg-secondary);
    }

    .payment-item.paid {
      opacity: 0.7;
    }

    .payment-item.overdue {
      border-color: var(--color-error);
      border-left-width: 3px;
    }

    .pay-toggle {
      width: 28px;
      height: 28px;
      min-width: 28px;
      border: 2px solid var(--color-border-light);
      border-radius: var(--border-radius-sm);
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      padding: 0;
    }

    .pay-toggle:hover {
      border-color: var(--color-primary);
    }

    .pay-toggle.checked {
      background: var(--color-success);
      border-color: var(--color-success);
    }

    .check-icon {
      color: white;
      font-size: 0.85rem;
      font-weight: 700;
      line-height: 1;
    }

    .payment-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      min-width: 0;
    }

    .payment-primary {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }

    .type-badge {
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 1px var(--spacing-xs);
      border-radius: var(--border-radius-sm);
      background: var(--color-bg-secondary);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }

    .type-rent {
      background: rgba(37, 99, 235, 0.1);
      color: var(--color-primary);
      border-color: transparent;
    }

    .type-bill {
      background: rgba(245, 158, 11, 0.1);
      color: var(--color-warning-dark);
      border-color: transparent;
    }

    .room-name {
      font-weight: 600;
      color: var(--color-text-primary);
      font-size: 0.95rem;
    }

    .tenant-name {
      color: var(--color-text-secondary);
      font-size: 0.85rem;
    }

    .payment-secondary {
      display: flex;
      gap: var(--spacing-md);
      font-size: 0.8rem;
      color: var(--color-text-tertiary);
    }

    .payment-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--spacing-xs);
      flex-shrink: 0;
    }

    .payment-amount {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-text-primary);
      font-family: 'JetBrains Mono', monospace;
    }

    .status-badge {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 2px var(--spacing-sm);
      border-radius: var(--border-radius-sm);
    }

    .status-paid {
      background: rgba(16, 185, 129, 0.1);
      color: var(--color-success-dark);
    }

    .status-due {
      background: rgba(245, 158, 11, 0.1);
      color: var(--color-warning-dark);
    }

    .status-overdue {
      background: rgba(239, 68, 68, 0.1);
      color: var(--color-error-dark);
    }

    .btn-delete {
      width: 28px;
      height: 28px;
      min-width: 28px;
      border: none;
      border-radius: var(--border-radius-sm);
      background: transparent;
      color: var(--color-text-tertiary);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
      padding: 0;
      flex-shrink: 0;
    }

    .btn-delete:hover {
      background: rgba(239, 68, 68, 0.1);
      color: var(--color-error);
    }

    @media (max-width: 768px) {
      .payment-item {
        flex-wrap: wrap;
      }

      .payment-right {
        width: 100%;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        padding-left: calc(28px + var(--spacing-md));
      }
    }
  `],
})
export class PaymentListComponent {
  payments = input.required<Payment[]>();
  tenants = input.required<Tenant[]>();
  rooms = input.required<Room[]>();
  paymentToggled = output<string>();
  paymentRemoved = output<string>();

  private readonly formatter = new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  enrichedPayments = computed(() => {
    const tenantMap = new Map(this.tenants().map((t) => [t.id, t]));
    const roomMap = new Map(this.rooms().map((r) => [r.id, r]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.payments().map((payment) => {
      const tenant = tenantMap.get(payment.tenantId);
      const room = roomMap.get(payment.roomId);
      const status = this.getStatus(payment, today);

      return {
        payment,
        tenantName: tenant?.name ?? 'Unknown',
        roomName: room?.name ?? 'Unknown',
        amountFormatted: this.formatter.format(payment.amount),
        dueDateFormatted: this.formatDate(payment.dueDate),
        paidDateFormatted: payment.paidDate ? this.formatDate(payment.paidDate) : '',
        status,
      };
    });
  });

  private getStatus(payment: Payment, today: Date): PaymentStatus {
    if (payment.paidDate) return 'paid';
    const parts = payment.dueDate.split('-').map(Number);
    const dueDate = new Date(parts[0], parts[1] - 1, parts[2]);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today ? 'overdue' : 'due';
  }

  private formatDate(dateStr: string): string {
    const parts = dateStr.split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
