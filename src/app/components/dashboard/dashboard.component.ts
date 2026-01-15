import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { ApartmentService } from '../../services/apartment.service';
import { MetricsCardComponent } from '../metrics-card/metrics-card.component';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MetricsCardComponent],
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
            <h2 class="apartment-title">{{ currentApartment()!.name }}</h2>
          </div>

          <section class="metrics-section">
            <h3 class="section-title">Financial Summary</h3>
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

    .apartment-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0;
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

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-lg);
    }

    @media (max-width: 1024px) {
      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: var(--spacing-md);
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }
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
}
