import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LogoComponent } from '../logo/logo.component';
import { ApartmentSelectorComponent } from '../apartment-selector/apartment-selector.component';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LogoComponent, ApartmentSelectorComponent],
  template: `
    <header class="app-header">
      <div class="header-left">
        <app-logo />
      </div>
      <div class="header-right">
        <app-apartment-selector />
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--color-card-bg);
      border-bottom: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    .header-left {
      display: flex;
      align-items: center;
    }

    .header-right {
      display: flex;
      align-items: center;
    }

    @media (max-width: 768px) {
      .app-header {
        flex-direction: column;
        gap: var(--spacing-md);
        align-items: flex-start;
      }

      .header-right {
        width: 100%;
      }
    }
  `],
})
export class AppHeaderComponent {}
