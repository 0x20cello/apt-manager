import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { ApartmentMetrics } from '../../models/apartment.model';

@Component({
  selector: 'app-metrics-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="metric-card" [class]="type()" [class.negative]="isNegative()">
      <span class="metric-label">{{ label() }}</span>
      <span class="metric-value">{{ formatCurrency(value()) }}</span>
      @if (showRange() && minValue() !== maxValue()) {
        <span class="metric-range">{{ formatCurrency(minValue()) }} - {{ formatCurrency(maxValue()) }}</span>
      }
    </div>
  `,
  styles: [`
    .metric-card {
      padding: var(--spacing-md);
      border-radius: var(--border-radius-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      border: 1px solid var(--color-border);
      background: var(--color-card-bg);
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease;
    }

    .metric-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
    }

    .metric-card.revenue {
      border-left: 3px solid var(--color-success);
    }

    .metric-card.costs {
      border-left: 3px solid var(--color-warning);
    }

    .metric-card.profit {
      border-left: 3px solid var(--color-primary);
    }

    .metric-card.profit.negative {
      border-left-color: var(--color-error);
    }

    .metric-label {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .metric-value {
      font-size: 1.25rem;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      color: var(--color-text-primary);
    }

    .metric-card.revenue .metric-value {
      color: var(--color-success-dark);
    }

    .metric-card.costs .metric-value {
      color: var(--color-warning-dark);
    }

    .metric-card.profit .metric-value {
      color: var(--color-primary);
    }

    .metric-card.profit.negative .metric-value {
      color: var(--color-error);
    }

    .metric-range {
      font-size: 0.7rem;
      color: var(--color-text-tertiary);
      font-family: 'JetBrains Mono', monospace;
    }
  `],
})
export class MetricsCardComponent {
  label = input.required<string>();
  value = input.required<number>();
  type = input<'revenue' | 'costs' | 'profit'>('revenue');
  minValue = input<number>(0);
  maxValue = input<number>(0);
  showRange = input<boolean>(false);
  isNegative = input<boolean>(false);

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
