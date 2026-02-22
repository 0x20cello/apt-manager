import { Component, inject, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { ApartmentService } from '../../services/apartment.service';
import { PaymentListComponent } from '../payment-list/payment-list.component';

@Component({
  selector: 'app-payments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaymentListComponent],
  template: `
    <div class="payments-page">
      <div class="page-header">
        <h1>Payments</h1>
        <p class="page-subtitle">Track rent payments for {{ currentApartment()?.name || 'selected apartment' }}</p>
      </div>

      @if (!currentApartment()) {
        <div class="empty-state">
          <div class="empty-icon">💳</div>
          <h3>No apartment selected</h3>
          <p>Select an apartment from the dropdown above to view payments</p>
        </div>
      } @else {
        <div class="payments-content">
          <div class="month-nav">
            <button class="btn-month" (click)="prevMonth()">‹</button>
            <span class="month-label">{{ monthLabel() }}</span>
            <button class="btn-month" (click)="nextMonth()">›</button>
          </div>

          <app-payment-list
            [payments]="payments()"
            [tenants]="currentApartment()!.tenants"
            [rooms]="currentApartment()!.rooms"
            (paymentToggled)="onPaymentToggled($event)"
            (paymentRemoved)="onPaymentRemoved($event)"
          />
        </div>
      }
    </div>
  `,
  styles: [`
    .payments-page {
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

    .payments-content {
      max-width: 800px;
    }

    .month-nav {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-xl);
    }

    .btn-month {
      width: 36px;
      height: 36px;
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-md);
      background: var(--color-card-bg);
      color: var(--color-text-primary);
      font-size: 1.25rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      padding: 0;
    }

    .btn-month:hover {
      background: var(--color-bg-secondary);
      border-color: var(--color-primary-light);
    }

    .month-label {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--color-text-primary);
      min-width: 160px;
      text-align: center;
    }

    @media (max-width: 768px) {
      .payments-page {
        padding: var(--spacing-md);
        padding-left: max(var(--spacing-md), env(safe-area-inset-left));
        padding-right: max(var(--spacing-md), env(safe-area-inset-right));
      }

      .page-header h1 {
        font-size: 1.5rem;
      }
    }
  `],
})
export class PaymentsComponent {
  private apartmentService = inject(ApartmentService);

  currentApartment = this.apartmentService.currentApartment;

  private readonly now = new Date();
  selectedMonth = signal(this.now.getMonth());
  selectedYear = signal(this.now.getFullYear());

  monthLabel = computed(() => {
    const date = new Date(this.selectedYear(), this.selectedMonth(), 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  payments = computed(() => {
    const apartment = this.currentApartment();
    if (!apartment) return [];
    return this.apartmentService.getPaymentsForMonth(apartment.id, this.selectedMonth(), this.selectedYear());
  });

  constructor() {
    effect(() => {
      const apartment = this.currentApartment();
      const month = this.selectedMonth();
      const year = this.selectedYear();
      if (apartment) {
        this.apartmentService.generateRentPayments(apartment.id, month, year);
      }
    });
  }

  prevMonth(): void {
    if (this.selectedMonth() === 0) {
      this.selectedMonth.set(11);
      this.selectedYear.update((y) => y - 1);
    } else {
      this.selectedMonth.update((m) => m - 1);
    }
  }

  nextMonth(): void {
    if (this.selectedMonth() === 11) {
      this.selectedMonth.set(0);
      this.selectedYear.update((y) => y + 1);
    } else {
      this.selectedMonth.update((m) => m + 1);
    }
  }

  onPaymentToggled(paymentId: string): void {
    const apartment = this.currentApartment();
    if (!apartment) return;
    this.apartmentService.togglePaymentPaid(apartment.id, paymentId);
  }

  onPaymentRemoved(paymentId: string): void {
    const apartment = this.currentApartment();
    if (!apartment) return;
    this.apartmentService.removePayment(apartment.id, paymentId);
  }
}
