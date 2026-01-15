import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="logo-container">
      <div class="logo-text">
        <span class="logo-e">E</span><span class="logo-ampersand">&</span><span class="logo-d">D</span>
      </div>
      <div class="logo-subtitle">Hospitality</div>
    </div>
  `,
  styles: [`
    .logo-container {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.125rem;
    }

    .logo-text {
      display: flex;
      align-items: baseline;
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1;
      color: var(--color-text-primary);
    }

    .logo-e {
      color: var(--color-primary);
    }

    .logo-ampersand {
      color: var(--color-text-secondary);
      font-weight: 400;
      margin: 0 0.125rem;
    }

    .logo-d {
      color: var(--color-primary-dark);
    }

    .logo-subtitle {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--color-text-secondary);
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
  `],
})
export class LogoComponent {}
