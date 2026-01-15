import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Room } from '../../models/apartment.model';

@Component({
  selector: 'app-room-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="section-header">
      <h3>Rooms</h3>
      <button class="btn-add-small" (click)="showAddForm.set(true)">+ Add Room</button>
    </div>

    @if (showAddForm()) {
      <div class="add-form">
        <input type="text" [(ngModel)]="newRoomName" placeholder="Room name" />
        <div class="rent-inputs">
          <input type="number" [(ngModel)]="newRoomRentMin" placeholder="Min rent" min="0" />
          <span class="separator">-</span>
          <input type="number" [(ngModel)]="newRoomRentMax" placeholder="Max rent" min="0" />
        </div>
        <div class="form-actions">
          <button class="btn-confirm" (click)="handleAdd()">Add</button>
          <button class="btn-cancel" (click)="showAddForm.set(false)">Cancel</button>
        </div>
      </div>
    }

    @if (rooms().length === 0) {
      <p class="empty-list">No rooms added yet</p>
    } @else {
      <div class="rooms-list">
        @for (room of rooms(); track room.id) {
          <div class="room-item" [class.taken]="room.isTaken">
            <div class="room-info">
              <input
                type="text"
                class="inline-edit"
                [value]="room.name"
                (blur)="onRoomNameChange(room.id, $event)"
                (keydown.enter)="blurTarget($event)"
              />
              <div class="rent-display">
                <input
                  type="number"
                  class="inline-number"
                  [value]="room.rentMin"
                  (blur)="onRentMinChange(room.id, $event)"
                  (keydown.enter)="blurTarget($event)"
                  min="0"
                />
                <span>-</span>
                <input
                  type="number"
                  class="inline-number"
                  [value]="room.rentMax"
                  (blur)="onRentMaxChange(room.id, $event)"
                  (keydown.enter)="blurTarget($event)"
                  min="0"
                />
                <span class="currency">AED/mo</span>
              </div>
            </div>
            <div class="room-actions">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  [checked]="room.isTaken"
                  (change)="onTakenChange(room.id, room.isTaken)"
                />
                <span class="checkbox-text">Taken</span>
              </label>
              <button class="btn-delete-small" (click)="onRemove(room.id)">✕</button>
            </div>
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

    .add-form input, .add-form select {
      padding: var(--spacing-sm);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-md);
      background: var(--color-card-bg);
      color: var(--color-text-primary);
      font-size: 0.9rem;
      font-family: inherit;
      transition: all 0.2s ease;
    }

    .add-form input:focus, .add-form select:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .add-form input::placeholder {
      color: var(--color-text-tertiary);
    }

    .rent-inputs {
      display: flex;
      gap: var(--spacing-sm);
      align-items: center;
    }

    .rent-inputs input {
      flex: 1;
    }

    .separator {
      color: var(--color-text-tertiary);
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

    .rooms-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .room-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-lg);
      transition: all 0.2s ease;
    }

    .room-item:hover {
      background: var(--color-bg-secondary);
    }

    .room-item.taken {
      background: rgba(16, 185, 129, 0.05);
      border-color: var(--color-success);
    }

    .room-info {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      flex: 1;
    }

    .inline-edit {
      background: transparent;
      border: none;
      color: var(--color-text-primary);
      font-size: 0.95rem;
      font-weight: 500;
      font-family: inherit;
      padding: var(--spacing-xs);
      border-radius: var(--border-radius-sm);
      width: 100%;
      transition: all 0.2s ease;
    }

    .inline-edit:hover {
      background: var(--color-bg-secondary);
    }

    .inline-edit:focus {
      outline: none;
      background: var(--color-bg-secondary);
    }

    .rent-display {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      color: var(--color-text-secondary);
      font-size: 0.85rem;
    }

    .inline-number {
      width: 70px;
      background: transparent;
      border: none;
      color: var(--color-text-secondary);
      font-size: 0.85rem;
      font-family: 'JetBrains Mono', monospace;
      padding: var(--spacing-xs);
      border-radius: var(--border-radius-sm);
      transition: all 0.2s ease;
    }

    .inline-number:hover {
      background: var(--color-bg-secondary);
    }

    .inline-number:focus {
      outline: none;
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
    }

    .inline-number::-webkit-inner-spin-button,
    .inline-number::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .currency {
      color: var(--color-text-tertiary);
      font-size: 0.75rem;
    }

    .room-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: var(--color-success);
      cursor: pointer;
    }

    .checkbox-text {
      color: var(--color-text-secondary);
      font-size: 0.85rem;
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
export class RoomListComponent {
  rooms = input.required<Room[]>();
  roomAdded = output<{ name: string; rentMin: number; rentMax: number }>();
  roomUpdated = output<{ id: string; updates: Partial<Omit<Room, 'id'>> }>();
  roomRemoved = output<string>();

  showAddForm = signal(false);
  newRoomName = signal('');
  newRoomRentMin = signal(0);
  newRoomRentMax = signal(0);

  handleAdd(): void {
    const name = this.newRoomName().trim();
    if (name) {
      this.roomAdded.emit({
        name,
        rentMin: this.newRoomRentMin(),
        rentMax: this.newRoomRentMax(),
      });
      this.newRoomName.set('');
      this.newRoomRentMin.set(0);
      this.newRoomRentMax.set(0);
      this.showAddForm.set(false);
    }
  }

  onRoomNameChange(id: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.roomUpdated.emit({ id, updates: { name: input.value } });
  }

  onRentMinChange(id: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.roomUpdated.emit({ id, updates: { rentMin: +input.value } });
  }

  onRentMaxChange(id: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.roomUpdated.emit({ id, updates: { rentMax: +input.value } });
  }

  onTakenChange(id: string, currentValue: boolean): void {
    this.roomUpdated.emit({ id, updates: { isTaken: !currentValue } });
  }

  onRemove(id: string): void {
    this.roomRemoved.emit(id);
  }

  blurTarget(event: Event): void {
    (event.target as HTMLElement).blur();
  }
}
