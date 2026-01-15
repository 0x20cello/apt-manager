import { Component, input, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { Tenant } from '../../models/apartment.model';

@Component({
  selector: 'app-tenant-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tenant-calendar">
      <div class="calendar-header">
        <button class="btn-nav" (click)="previousMonth()">‹</button>
        <h3 class="month-year">{{ monthYear() }}</h3>
        <button class="btn-nav" (click)="nextMonth()">›</button>
      </div>

      <div class="calendar-grid">
        <div class="day-header">Sun</div>
        <div class="day-header">Mon</div>
        <div class="day-header">Tue</div>
        <div class="day-header">Wed</div>
        <div class="day-header">Thu</div>
        <div class="day-header">Fri</div>
        <div class="day-header">Sat</div>

        @for (day of calendarDays(); track day.date || day.day) {
          @if (day.isCurrentMonth) {
            <div
              class="calendar-day"
              [class.outside-range]="!isInRange(day.date)"
              [class.disabled]="isDisabled(day.date)"
              [class.today]="isToday(day.date)"
              (click)="toggleDate(day.date)"
              [title]="getDayTitle(day.date)"
            >
              <span class="day-number">{{ day.day }}</span>
            </div>
          } @else {
            <div class="calendar-day empty-day"></div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .tenant-calendar {
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-lg);
      padding: var(--spacing-lg);
    }

    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-lg);
    }

    .btn-nav {
      width: 32px;
      height: 32px;
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-md);
      background: var(--color-card-bg);
      color: var(--color-text-primary);
      font-size: 1.2rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-nav:hover {
      background: var(--color-bg-secondary);
      border-color: var(--color-primary);
    }

    .month-year {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: var(--spacing-xs);
    }

    .day-header {
      text-align: center;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      padding: var(--spacing-sm);
    }

    .calendar-day {
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-sm);
      background: var(--color-primary);
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }

    .calendar-day:hover:not(.outside-range) {
      transform: scale(1.05);
      border-color: var(--color-primary-dark);
    }

    .calendar-day.outside-range {
      background: var(--color-bg-secondary);
      border-color: transparent;
      cursor: not-allowed;
      opacity: 0.3;
    }

    .calendar-day.disabled {
      background: white;
      border-color: var(--color-border);
    }

    .calendar-day.today {
      border: 2px solid var(--color-primary);
    }

    .day-number {
      font-size: 0.875rem;
      font-weight: 500;
      color: white;
    }

    .calendar-day.outside-range .day-number {
      color: var(--color-text-secondary);
    }

    .calendar-day.disabled .day-number {
      color: var(--color-text-primary);
    }

    .calendar-day.empty-day {
      background: transparent;
      border: none;
      cursor: default;
      pointer-events: none;
    }
  `],
})
export class TenantCalendarComponent {
  tenant = input.required<Tenant>();
  dateToggled = output<{ date: string; disabled: boolean }>();

  private currentDate = new Date();
  currentYear = signal(this.currentDate.getFullYear());
  currentMonth = signal(this.currentDate.getMonth());

  monthYear = computed(() => {
    return new Date(this.currentYear(), this.currentMonth()).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  });

  calendarDays = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const dayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: Array<{ day: number; date: string; isCurrentMonth: boolean }> = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < dayOfWeek; i++) {
      days.push({
        day: 0,
        date: '',
        isCurrentMonth: false,
      });
    }

    // Add all days of the current month
    const current = new Date(firstDay);
    while (current <= lastDay) {
      const dateStr = this.formatDate(current);
      days.push({
        day: current.getDate(),
        date: dateStr,
        isCurrentMonth: true,
      });
      current.setDate(current.getDate() + 1);
    }

    // Add empty cells at the end to complete the grid (ensure multiple of 7)
    const totalCells = days.length;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let i = 0; i < remainingCells; i++) {
      days.push({
        day: 0,
        date: '',
        isCurrentMonth: false,
      });
    }

    return days;
  });

  isInRange(dateStr: string): boolean {
    const tenant = this.tenant();
    const date = this.parseDate(dateStr);
    
    if (tenant.startDate) {
      const start = new Date(tenant.startDate);
      start.setHours(0, 0, 0, 0);
      if (date < start) return false;
    }

    if (tenant.endDate) {
      const end = new Date(tenant.endDate);
      end.setHours(23, 59, 59, 999);
      if (date > end) return false;
    }

    return true;
  }

  isDisabled(dateStr: string): boolean {
    if (!this.isInRange(dateStr)) return false;
    const tenant = this.tenant();
    return tenant.disabledDates?.includes(dateStr) || false;
  }

  isToday(dateStr: string): boolean {
    const today = this.formatDate(new Date());
    return dateStr === today;
  }

  toggleDate(dateStr: string): void {
    if (!this.isInRange(dateStr)) return;

    const isCurrentlyDisabled = this.isDisabled(dateStr);
    this.dateToggled.emit({ date: dateStr, disabled: !isCurrentlyDisabled });
  }

  previousMonth(): void {
    const month = this.currentMonth();
    if (month === 0) {
      this.currentMonth.set(11);
      this.currentYear.update(y => y - 1);
    } else {
      this.currentMonth.update(m => m - 1);
    }
  }

  nextMonth(): void {
    const month = this.currentMonth();
    if (month === 11) {
      this.currentMonth.set(0);
      this.currentYear.update(y => y + 1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
  }


  getDayTitle(dateStr: string): string {
    const date = this.parseDate(dateStr);
    const formatted = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    if (!this.isInRange(dateStr)) {
      return `${formatted} - Outside contract period`;
    }
    
    if (this.isDisabled(dateStr)) {
      return `${formatted} - Not occupied`;
    }
    
    return `${formatted} - Occupied`;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private parseDate(dateStr: string): Date {
    return new Date(dateStr + 'T00:00:00');
  }
}
