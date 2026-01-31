import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApartmentService } from '../../services/apartment.service';
import { MetricsCardComponent } from '../metrics-card/metrics-card.component';
import { Tenant, Room } from '../../models/apartment.model';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MetricsCardComponent, FormsModule],
  template: `
    <div class="dashboard-container">
      @if (!currentApartment()) {
        <div class="empty-state">
          <div class="empty-icon">🏠</div>
          <h3>No apartment selected</h3>
          <p>Select an apartment from the dropdown above or add a new apartment from the sidebar</p>
        </div>
      } @else {
        <div class="dashboard-content">
          <div class="dashboard-header">
            <input
              type="text"
              class="apartment-title-input"
              [value]="currentApartment()!.name"
              (blur)="onApartmentNameChange($event)"
              (keydown.enter)="blurTarget($event)"
            />
          </div>

          <section class="metrics-section">
            <h3 class="section-title">Financial Summary</h3>
            @let metrics = getMetrics();
            <div class="metrics-columns">
              <div class="metrics-column">
                <h4 class="column-title">Revenue</h4>
                <div class="column-cards">
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
                </div>
              </div>
              <div class="metrics-column">
                <h4 class="column-title">Costs</h4>
                <div class="column-cards">
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
                </div>
              </div>
              <div class="metrics-column">
                <h4 class="column-title">Profit</h4>
                <div class="column-cards">
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
              </div>
            </div>
          </section>

          <section class="rent-collections-section">
            <h3 class="section-title">Upcoming Rent Collections</h3>
            @let collections = getUpcomingRentCollections();
            @if (collections.length === 0) {
              <p class="no-collections">No upcoming rent collections this month</p>
            } @else {
              <div class="collections-list">
                @for (collection of collections; track collection.id) {
                  <div class="collection-item">
                    <div class="collection-date">
                      <span class="date-day">{{ collection.day }}</span>
                      <span class="date-month">{{ collection.monthName }}</span>
                    </div>
                    <div class="collection-details">
                      <div class="collection-tenant">{{ collection.tenantName }}</div>
                      <div class="collection-room">Room: {{ collection.roomName }}</div>
                    </div>
                    <div class="collection-amount">
                      <span class="amount-value">{{ formatCurrency(collection.amount) }}</span>
                      @if (collection.amountMin !== collection.amountMax) {
                        <span class="amount-range">
                          ({{ formatCurrency(collection.amountMin) }} - {{ formatCurrency(collection.amountMax) }})
                        </span>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: var(--spacing-xl);
      min-height: 100%;
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

    .dashboard-content {
      max-width: 1200px;
      margin: 0 auto;
    }

    .dashboard-header {
      margin-bottom: var(--spacing-xl);
    }

    .apartment-title-input {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0;
      background: transparent;
      border: 2px solid transparent;
      border-radius: var(--border-radius-md);
      padding: var(--spacing-xs) var(--spacing-sm);
      font-family: inherit;
      width: 100%;
      max-width: 600px;
      transition: all 0.2s ease;
    }

    .apartment-title-input:hover {
      border-color: var(--color-border);
      background: var(--color-bg-secondary);
    }

    .apartment-title-input:focus {
      outline: none;
      border-color: var(--color-primary);
      background: var(--color-card-bg);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .metrics-section {
      margin-bottom: var(--spacing-xl);
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-lg) 0;
    }

    .metrics-columns {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-xl);
    }

    .metrics-column {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      align-items: stretch;
    }

    .column-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      margin: 0 0 var(--spacing-xs) 0;
      padding-left: calc(3px + var(--spacing-md));
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .column-cards {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    @media (max-width: 1024px) {
      .metrics-columns {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: var(--spacing-md);
        padding-left: max(var(--spacing-md), env(safe-area-inset-left));
        padding-right: max(var(--spacing-md), env(safe-area-inset-right));
      }

      .metrics-columns {
        grid-template-columns: 1fr;
      }
    }

    .rent-collections-section {
      margin-top: var(--spacing-xl);
    }

    .no-collections {
      color: var(--color-text-secondary);
      text-align: center;
      padding: var(--spacing-lg);
      margin: 0;
    }

    .collections-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .collection-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      padding: var(--spacing-md);
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-lg);
      transition: all 0.2s ease;
    }

    .collection-item:hover {
      background: var(--color-bg-secondary);
      border-color: var(--color-primary-light);
    }

    .collection-date {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-width: 60px;
      padding: var(--spacing-sm);
      background: var(--color-primary);
      border-radius: var(--border-radius-md);
      color: white;
    }

    .date-day {
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1;
    }

    .date-month {
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
      opacity: 0.9;
    }

    .collection-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .collection-tenant {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .collection-room {
      font-size: 0.85rem;
      color: var(--color-text-secondary);
    }

    .collection-amount {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--spacing-xs);
    }

    .amount-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-primary);
    }

    .amount-range {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
    }
  `],
})
export class DashboardComponent {
  private apartmentService = inject(ApartmentService);

  currentApartment = this.apartmentService.currentApartment;

  getMetrics() {
    const apartment = this.currentApartment();
    if (!apartment) {
      return {
        monthlyRevenue: 0,
        yearlyRevenue: 0,
        monthlyCosts: 0,
        yearlyCosts: 0,
        monthlyProfit: 0,
        yearlyProfit: 0,
        minMonthlyRevenue: 0,
        maxMonthlyRevenue: 0,
        minYearlyRevenue: 0,
        maxYearlyRevenue: 0,
        minMonthlyProfit: 0,
        maxMonthlyProfit: 0,
        minYearlyProfit: 0,
        maxYearlyProfit: 0,
      };
    }
    return this.apartmentService.calculateMetrics(apartment);
  }

  getUpcomingRentCollections(): Array<{
    id: string;
    day: number;
    monthName: string;
    tenantName: string;
    roomName: string;
    amount: number;
    amountMin: number;
    amountMax: number;
  }> {
    const apartment = this.currentApartment();
    if (!apartment) return [];

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = today.getDate();

    const collections: Array<{
      id: string;
      day: number;
      monthName: string;
      tenantName: string;
      roomName: string;
      amount: number;
      amountMin: number;
      amountMax: number;
    }> = [];

    for (const tenant of apartment.tenants) {
      if (!tenant.rentCollectionDay) continue;

      const collectionDay = tenant.rentCollectionDay;
      const room = apartment.rooms.find((r) => r.id === tenant.roomId);
      if (!room) continue;

      // Check if collection day is today or in the future this month
      if (collectionDay >= currentDay && collectionDay <= lastDayOfMonth) {
        const date = new Date(currentYear, currentMonth, collectionDay);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const amount = (room.rentMin + room.rentMax) / 2;

        collections.push({
          id: `${tenant.id}-${collectionDay}`,
          day: collectionDay,
          monthName,
          tenantName: tenant.name,
          roomName: room.name,
          amount,
          amountMin: room.rentMin,
          amountMax: room.rentMax,
        });
      }
    }

    // Sort by collection day
    return collections.sort((a, b) => a.day - b.day);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  onApartmentNameChange(event: Event): void {
    const apartment = this.currentApartment();
    if (!apartment) return;

    const input = event.target as HTMLInputElement;
    const newName = input.value.trim();
    if (newName && newName !== apartment.name) {
      this.apartmentService.updateApartmentName(apartment.id, newName);
    } else {
      // Reset to original name if empty or unchanged
      input.value = apartment.name;
    }
  }

  blurTarget(event: Event): void {
    (event.target as HTMLElement).blur();
  }
}
