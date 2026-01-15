import { Component, input, output, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tenant, Room } from '../../models/apartment.model';
import { ApartmentService } from '../../services/apartment.service';
import { TenantCalendarModalComponent } from '../tenant-calendar-modal/tenant-calendar-modal.component';

@Component({
  selector: 'app-tenant-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TenantCalendarModalComponent],
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
      <div class="tenants-table-wrapper">
        <table class="tenants-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Room</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (tenant of tenants(); track tenant.id) {
              <tr>
                <td>
                  <input
                    type="text"
                    class="inline-edit tenant-name"
                    [value]="tenant.name"
                    (blur)="onTenantNameChange(tenant.id, $event)"
                    (keydown.enter)="blurTarget($event)"
                  />
                </td>
                <td>
                  @let room = getRoomName(tenant.roomId);
                  <span class="tenant-room">{{ room || 'Unknown' }}</span>
                </td>
                <td>
                  @if (tenant.email) {
                    <span class="tenant-email">{{ tenant.email }}</span>
                  } @else {
                    <span class="text-muted">—</span>
                  }
                </td>
                <td>
                  @if (tenant.phone) {
                    <a
                      class="tenant-phone phone-link"
                      [href]="getWhatsAppUrl(tenant.phone)"
                      target="_blank"
                      rel="noopener noreferrer"
                      (click)="$event.stopPropagation()"
                    >
                      {{ tenant.phone }}
                    </a>
                  } @else {
                    <span class="text-muted">—</span>
                  }
                </td>
                <td>
                  @if (tenant.startDate) {
                    <span class="tenant-date">{{ formatDate(tenant.startDate) }}</span>
                  } @else {
                    <span class="text-muted">—</span>
                  }
                </td>
                <td>
                  @if (tenant.endDate) {
                    <span class="tenant-date">{{ formatDate(tenant.endDate) }}</span>
                  } @else {
                    <span class="text-muted">—</span>
                  }
                </td>
                <td>
                  @if (tenant.notes) {
                    <span class="tenant-notes" [title]="tenant.notes">{{ tenant.notes.length > 30 ? tenant.notes.substring(0, 30) + '...' : tenant.notes }}</span>
                  } @else {
                    <span class="text-muted">—</span>
                  }
                </td>
                <td>
                  <div class="table-actions">
                    <button class="btn-edit" (click)="openEditModal(tenant)" title="Edit Tenant">✏️</button>
                    @if (tenant.startDate) {
                      <button class="btn-calendar" (click)="openCalendar(tenant)" title="Edit Presence">
                        📅
                      </button>
                    }
                    <button class="btn-delete" (click)="onRemove(tenant.id)" title="Delete">✕</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (selectedTenantForCalendar()) {
      <app-tenant-calendar-modal
        [tenant]="selectedTenantForCalendar()"
        (close)="closeCalendar()"
        (dateToggled)="onOccupancyToggle(selectedTenantForCalendar()!.id, $event)"
      />
    }

    @if (selectedTenantForEdit()) {
      <div class="modal-backdrop" (click)="closeEditModal()">
        <div class="modal-content edit-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Edit Tenant</h2>
            <button class="btn-close" (click)="closeEditModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="edit-form">
              <div class="form-group">
                <label>Name *</label>
                <input type="text" [(ngModel)]="editTenantName" placeholder="Tenant name" required />
              </div>
              <div class="form-group">
                <label>Room *</label>
                <select [(ngModel)]="editTenantRoomId" required>
                  <option value="">Select a room</option>
                  @for (room of rooms(); track room.id) {
                    <option [value]="room.id">{{ room.name }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" [(ngModel)]="editTenantEmail" placeholder="Email (optional)" />
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input type="tel" [(ngModel)]="editTenantPhone" placeholder="Phone (optional)" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Start Date</label>
                  <input type="date" [(ngModel)]="editTenantStartDate" />
                </div>
                <div class="form-group">
                  <label>End Date</label>
                  <input type="date" [(ngModel)]="editTenantEndDate" />
                </div>
              </div>
              <div class="form-group">
                <label>Notes</label>
                <textarea
                  [(ngModel)]="editTenantNotes"
                  placeholder="Notes (optional)"
                  rows="3"
                ></textarea>
              </div>
              <div class="form-actions">
                <button class="btn-confirm" (click)="saveEdit()">Save</button>
                <button class="btn-cancel" (click)="closeEditModal()">Cancel</button>
              </div>
            </div>
          </div>
        </div>
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

    .tenants-table-wrapper {
      overflow-x: auto;
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-lg);
    }

    .tenants-table {
      width: 100%;
      border-collapse: collapse;
    }

    .tenants-table thead {
      background: var(--color-bg-secondary);
    }

    .tenants-table th {
      padding: var(--spacing-md);
      text-align: left;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-primary);
      border-bottom: 2px solid var(--color-border);
    }

    .tenants-table td {
      padding: var(--spacing-md);
      border-bottom: 1px solid var(--color-border);
      font-size: 0.9rem;
      color: var(--color-text-primary);
    }

    .tenants-table tbody tr:hover {
      background: var(--color-bg-secondary);
    }

    .tenants-table tbody tr:last-child td {
      border-bottom: none;
    }

    .tenant-name {
      background: transparent;
      border: 1px solid transparent;
      color: var(--color-text-primary);
      font-size: 0.9rem;
      font-weight: 600;
      font-family: inherit;
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--border-radius-sm);
      width: 100%;
      min-width: 120px;
      transition: all 0.2s ease;
    }

    .tenant-name:hover {
      border-color: var(--color-border);
      background: var(--color-bg-secondary);
    }

    .tenant-name:focus {
      outline: none;
      border-color: var(--color-primary);
      background: var(--color-card-bg);
    }

    .tenant-room {
      font-weight: 500;
      color: var(--color-primary);
    }

    .tenant-email {
      color: var(--color-text-secondary);
    }

    .phone-link {
      color: var(--color-primary);
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .phone-link:hover {
      color: var(--color-primary-dark);
      text-decoration: underline;
    }

    .tenant-date {
      color: var(--color-text-secondary);
      font-size: 0.85rem;
    }

    .tenant-notes {
      font-size: 0.85rem;
      color: var(--color-text-secondary);
      font-style: italic;
      max-width: 200px;
    }

    .text-muted {
      color: var(--color-text-tertiary);
      font-style: italic;
    }

    .table-actions {
      display: flex;
      gap: var(--spacing-xs);
      align-items: center;
    }

    .btn-edit,
    .btn-calendar,
    .btn-delete {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: var(--border-radius-sm);
      background: transparent;
      color: var(--color-text-tertiary);
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-edit:hover {
      background: rgba(16, 185, 129, 0.1);
      color: var(--color-success);
    }

    .btn-calendar:hover {
      background: rgba(37, 99, 235, 0.1);
      color: var(--color-primary);
    }

    .btn-delete:hover {
      background: rgba(239, 68, 68, 0.1);
      color: var(--color-error);
    }

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

    .edit-modal {
      background: var(--color-card-bg);
      border-radius: var(--border-radius-lg);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .edit-modal .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg);
      border-bottom: 1px solid var(--color-border);
    }

    .edit-modal .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .edit-modal .btn-close {
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

    .edit-modal .btn-close:hover {
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
    }

    .edit-modal .modal-body {
      padding: var(--spacing-lg);
    }

    .edit-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .form-group label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: var(--spacing-sm) var(--spacing-md);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-md);
      background: var(--color-card-bg);
      color: var(--color-text-primary);
      font-size: 0.9rem;
      font-family: inherit;
      transition: all 0.2s ease;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-md);
    }
  `],
})
export class TenantListComponent {
  tenants = input.required<Tenant[]>();
  rooms = input.required<Room[]>();
  tenantAdded = output<Omit<Tenant, 'id'>>();
  tenantUpdated = output<{ id: string; updates: Partial<Omit<Tenant, 'id'>> }>();
  tenantRemoved = output<string>();
  tenantOccupancyToggled = output<{ id: string; date: string; disabled: boolean }>();

  showAddForm = signal(false);
  newTenantName = signal('');
  newTenantEmail = signal('');
  newTenantPhone = signal('');
  newTenantRoomId = signal('');
  newTenantStartDate = signal('');
  newTenantEndDate = signal('');
  newTenantNotes = signal('');
  selectedTenantForCalendar = signal<Tenant | null>(null);
  selectedTenantForEdit = signal<Tenant | null>(null);
  editTenantName = signal('');
  editTenantEmail = signal('');
  editTenantPhone = signal('');
  editTenantRoomId = signal('');
  editTenantStartDate = signal('');
  editTenantEndDate = signal('');
  editTenantNotes = signal('');

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

  onOccupancyToggle(tenantId: string, event: { date: string; disabled: boolean }): void {
    this.tenantOccupancyToggled.emit({ id: tenantId, date: event.date, disabled: event.disabled });
  }

  openCalendar(tenant: Tenant): void {
    this.selectedTenantForCalendar.set(tenant);
  }

  closeCalendar(): void {
    this.selectedTenantForCalendar.set(null);
  }

  getWhatsAppUrl(phone: string): string {
    // Remove all non-numeric characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    // Remove + if present and ensure it's just numbers
    const numberOnly = cleaned.replace(/^\+/, '');
    // Return WhatsApp Web URL
    return `https://wa.me/${numberOnly}`;
  }

  openEditModal(tenant: Tenant): void {
    this.selectedTenantForEdit.set(tenant);
    this.editTenantName.set(tenant.name);
    this.editTenantEmail.set(tenant.email || '');
    this.editTenantPhone.set(tenant.phone || '');
    this.editTenantRoomId.set(tenant.roomId);
    this.editTenantStartDate.set(tenant.startDate || '');
    this.editTenantEndDate.set(tenant.endDate || '');
    this.editTenantNotes.set(tenant.notes || '');
  }

  closeEditModal(): void {
    this.selectedTenantForEdit.set(null);
    this.editTenantName.set('');
    this.editTenantEmail.set('');
    this.editTenantPhone.set('');
    this.editTenantRoomId.set('');
    this.editTenantStartDate.set('');
    this.editTenantEndDate.set('');
    this.editTenantNotes.set('');
  }

  saveEdit(): void {
    const tenant = this.selectedTenantForEdit();
    if (!tenant) return;

    const name = this.editTenantName().trim();
    const roomId = this.editTenantRoomId();
    if (name && roomId) {
      this.tenantUpdated.emit({
        id: tenant.id,
        updates: {
          name,
          email: this.editTenantEmail().trim() || undefined,
          phone: this.editTenantPhone().trim() || undefined,
          roomId,
          startDate: this.editTenantStartDate() || undefined,
          endDate: this.editTenantEndDate() || undefined,
          notes: this.editTenantNotes().trim() || undefined,
        },
      });
      this.closeEditModal();
    }
  }
}
