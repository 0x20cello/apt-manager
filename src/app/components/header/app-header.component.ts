import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { LogoComponent } from '../logo/logo.component';
import { ApartmentSelectorComponent } from '../apartment-selector/apartment-selector.component';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LogoComponent, ApartmentSelectorComponent],
  template: `
    <header class="app-header">
      <div class="header-left">
        <button type="button" class="menu-btn" (click)="layout.toggleMobileMenu()" aria-label="Open menu">
          <span class="menu-icon"></span>
          <span class="menu-icon"></span>
          <span class="menu-icon"></span>
        </button>
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
      padding-left: max(var(--spacing-lg), env(safe-area-inset-left));
      padding-right: max(var(--spacing-xl), env(safe-area-inset-right));
      background: var(--color-card-bg);
      border-bottom: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .header-right {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
      justify-content: flex-end;
    }

    .menu-btn {
      display: none;
      flex-direction: column;
      justify-content: center;
      gap: 5px;
      width: 44px;
      height: 44px;
      padding: 0;
      border: none;
      border-radius: var(--border-radius-md);
      background: transparent;
      color: var(--color-text-primary);
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .menu-btn:hover {
      background: var(--color-bg-secondary);
    }

    .menu-icon {
      display: block;
      width: 20px;
      height: 2px;
      background: currentColor;
      border-radius: 1px;
    }

    @media (max-width: 768px) {
      .menu-btn {
        display: flex;
      }

      .app-header {
        flex-wrap: wrap;
        gap: var(--spacing-md);
      }

      .header-right {
        width: 100%;
        order: 3;
      }
    }

    @media (min-width: 769px) {
      .menu-btn {
        display: none;
      }
    }
  `],
})
export class AppHeaderComponent {
  layout = inject(LayoutService);
}
