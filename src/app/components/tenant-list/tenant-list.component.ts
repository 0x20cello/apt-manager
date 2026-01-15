import { Component, input, output, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tenant, Room } from '../../models/apartment.model';
import { ApartmentService } from '../../services/apartment.service';

@Component({
  selector: 'app-tenant-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="section-header">
      <h3>Tenants</h3>
      <button class="btn-add-small" (click)="showAddForm.set(true)">+ Add Tenant</button>
    </div>

    @if (showAddForm()) {
      <div class="add-form">
        <input type="text" [(ngModel)]="newTenantName" placeholder="Tenant name" required />
        <input type="email" [(ngModel)]="newTenantEmail" placeholder="Email (optional)" />
        <input type="tel" [(ngModel)]="newTenantPhone" placeholder="Phone (optional)" />
        <select [(ngModel)]="newTenantRoomId" required>
          <option value="">Select a room</option>
          @for (room of rooms(); track room.id) {
            <option [value]="room.id">{{ room.name }}</option>
          }
        </select>
        <div class="date-inputs">
          <input type="date" [(ngModel)]="newTenantStartDate" placeholder="Start date (optional)" />
          <input type="date" [(ngModel)]="newTenantEndDate" placeholder="End date (optional)" />
        </div>
        <textarea
          [(ngModel)]="newTenantNotes"
          placeholder="Notes (optional)"
          rows="3"
        ></textarea>
        <div class="form-actions">
          <button class="btn-confirm" (click)="handleAdd()">Add</button>
          <button class="btn-cancel" (click)="showAddForm.set(false)">Cancel</button>
        </div>
      </div>
    }

    @if (tenants().length === 0) {
      <p class="empty-list">No tenants added yet</p>
    } @else {
      <div class="tenants-list">
        @for (tenant of tenants(); track tenant.id) {
          <div class="tenant-item">
            <div class="tenant-info">
              <input
                type="text"
                class="inline-edit tenant-name"
                [value]="tenant.name"
                (blur)="onTenantNameChange(tenant.id, $event)"
                (keydown.enter)="blurTarget($event)"
              />
              <div class="tenant-details">
                @let room = getRoomName(tenant.roomId);
                <span class="tenant-room">Room: {{ room || 'Unknown' }}</span>
                @if (tenant.email) {
                  <span class="tenant-email">{{ tenant.email }}</span>
                }
                @if (tenant.phone) {
                  <span class="tenant-phone">{{ tenant.phone }}</span>
                }
                @if (tenant.startDate) {
                  <span class="tenant-date">From: {{ formatDate(tenant.startDate) }}</span>
                }
                @if (tenant.endDate) {
                  <span class="tenant-date">To: {{ formatDate(tenant.endDate) }}</span>
                }
              </div>
              @if (tenant.notes) {
                <p class="tenant-notes">{{ tenant.notes }}</p>
              }
            </div>
            <button class="btn-delete-small" (click)="onRemove(tenant.id)">✕</button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
    }

    .section-header h3 {
      color: var(--color-text-primary);
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
    }

    .btn-add-small {
      padding: var(--spacing-sm) var(--spacing-md);
      border: 1px solid var(--color-primary-light);
      border-radius: var(--border-radius-md);
      background: transparent;
      color: var(--color-primary);
      font-size: 0.85rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-add-small:hover {
      background: var(--color-primary-lighter);
      background-opacity: 0.1;
      border-color: var(--color-primary);
    }

    .add-form {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-primary-light);
      border-radius: var(--border-radius-lg);
      padding: var(--spacing-md);
      margin-bottom: var(--spacing-md);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .add-form input, .add-form select, .add-form textarea {
      padding: var(--spacing-sm);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-md);
      background: var(--color-card-bg);
      color: var(--color-text-primary);
      font-size: 0.9rem;
      font-family: inherit;
      transition: all 0.2s ease;
    }

    .add-form input:focus, .add-form select:focus, .add-form textarea:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .add-form input::placeholder, .add-form textarea::placeholder {
      color: var(--color-text-tertiary);
    }

    .date-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-sm);
    }

    .form-actions {
      display: flex;
      gap: var(--spacing-sm);
      justify-content: flex-end;
    }

    .btn-confirm {
      padding: var(--spacing-sm) var(--spacing-md);
      border: none;
      border-radius: var(--border-radius-md);
      background: var(--color-primary);
      color: white;
      font-size: 0.85rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-confirm:hover {
      background: var(--color-primary-dark);
      transform: translateY(-1px);
    }

    .btn-cancel {
      padding: var(--spacing-sm) var(--spacing-md);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-md);
      background: transparent;
      color: var(--color-text-secondary);
      font-size: 0.85rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-cancel:hover {
      border-color: var(--color-border-light);
      color: var(--color-text-primary);
    }

    .empty-list {
      color: var(--color-text-tertiary);
      font-size: 0.9rem;
      text-align: center;
      padding: var(--spacing-md);
      margin: 0;
    }

    .tenants-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .tenant-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: var(--spacing-md);
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-lg);
      transition: all 0.2s ease;
    }

    .tenant-item:hover {
      background: var(--color-bg-secondary);
    }

    .tenant-info {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      flex: 1;
    }

    .tenant-name {
      background: transparent;
      border: none;
      color: var(--color-text-primary);
      font-size: 1rem;
      font-weight: 600;
      font-family: inherit;
      padding: var(--spacing-xs);
      border-radius: var(--border-radius-sm);
      width: 100%;
      transition: all 0.2s ease;
    }

    .tenant-name:hover {
      background: var(--color-bg-secondary);
    }

    .tenant-name:focus {
      outline: none;
      background: var(--color-bg-secondary);
    }

    .tenant-details {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-md);
      font-size: 0.85rem;
      color: var(--color-text-secondary);
    }

    .tenant-room {
      font-weight: 500;
      color: var(--color-primary);
    }

    .tenant-notes {
      margin: var(--spacing-xs) 0 0 0;
      font-size: 0.85rem;
      color: var(--color-text-secondary);
      font-style: italic;
    }

    .btn-delete-small {
      width: 28px;
      height: 28px;
      border: none;
      border-radius: var(--border-radius-sm);
      background: transparent;
      color: var(--color-text-tertiary);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-delete-small:hover {
      background: rgba(239, 68, 68, 0.1);
      color: var(--color-error);
    }
  `],
})
export class TenantListComponent {
  tenants = input.required<Tenant[]>();
  rooms = input.required<Room[]>();
  tenantAdded = output<Omit<Tenant, 'id'>>();
  tenantUpdated = output<{ id: string; updates: Partial<Omit<Tenant, 'id'>> }>();
  tenantRemoved = output<string>();

  showAddForm = signal(false);
  newTenantName = signal('');
  newTenantEmail = signal('');
  newTenantPhone = signal('');
  newTenantRoomId = signal('');
  newTenantStartDate = signal('');
  newTenantEndDate = signal('');
  newTenantNotes = signal('');

  getRoomName(roomId: string): string {
    return this.rooms().find((r) => r.id === roomId)?.name || '';
  }

  handleAdd(): void {
    const name = this.newTenantName().trim();
    const roomId = this.newTenantRoomId();
    if (name && roomId) {
      this.tenantAdded.emit({
        name,
        email: this.newTenantEmail().trim() || undefined,
        phone: this.newTenantPhone().trim() || undefined,
        roomId,
        startDate: this.newTenantStartDate() || undefined,
        endDate: this.newTenantEndDate() || undefined,
        notes: this.newTenantNotes().trim() || undefined,
      });
      this.newTenantName.set('');
      this.newTenantEmail.set('');
      this.newTenantPhone.set('');
      this.newTenantRoomId.set('');
      this.newTenantStartDate.set('');
      this.newTenantEndDate.set('');
      this.newTenantNotes.set('');
      this.showAddForm.set(false);
    }
  }

  onTenantNameChange(id: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.tenantUpdated.emit({ id, updates: { name: input.value } });
  }

  onRemove(id: string): void {
    this.tenantRemoved.emit(id);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  blurTarget(event: Event): void {
    (event.target as HTMLElement).blur();
  }
}
