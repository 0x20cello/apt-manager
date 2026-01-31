import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Tenant } from '../../models/apartment.model';
import { TenantCalendarComponent } from '../tenant-calendar/tenant-calendar.component';

@Component({
  selector: 'app-tenant-calendar-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TenantCalendarComponent],
  template: `
    <div class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Presence Calendar - {{ tenant()?.name }}</h2>
          <button class="btn-close" (click)="close.emit()">✕</button>
        </div>
        <div class="modal-body">
          @if (tenant()) {
            <app-tenant-calendar
              [tenant]="tenant()!"
              (dateToggled)="onDateToggled($event)"
            />
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: var(--spacing-lg);
    }

    .modal-content {
      background: var(--color-card-bg);
      border-radius: var(--border-radius-lg);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg);
      border-bottom: 1px solid var(--color-border);
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .btn-close {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: var(--border-radius-md);
      background: transparent;
      color: var(--color-text-secondary);
      font-size: 1.2rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-close:hover {
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
    }

    .modal-body {
      padding: var(--spacing-lg);
    }

    @media (max-width: 768px) {
      .modal-backdrop {
        padding: max(var(--spacing-md), env(safe-area-inset-top)) max(var(--spacing-md), env(safe-area-inset-right)) max(var(--spacing-md), env(safe-area-inset-bottom)) max(var(--spacing-md), env(safe-area-inset-left));
        align-items: flex-start;
      }

      .modal-content {
        max-height: 90dvh;
      }

      .modal-header h2 {
        font-size: 1rem;
      }
    }
  `],
})
export class TenantCalendarModalComponent {
  tenant = input<Tenant | null>(null);
  close = output<void>();
  dateToggled = output<{ date: string; disabled: boolean }>();

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onDateToggled(event: { date: string; disabled: boolean }): void {
    this.dateToggled.emit(event);
  }
}
