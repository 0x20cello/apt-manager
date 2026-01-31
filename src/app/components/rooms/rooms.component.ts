import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ApartmentService } from '../../services/apartment.service';
import { RoomListComponent } from '../room-list/room-list.component';

@Component({
  selector: 'app-rooms',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RoomListComponent],
  template: `
    <div class="rooms-page">
      <div class="page-header">
        <h1>Rooms</h1>
        <p class="page-subtitle">Manage rooms for {{ currentApartment()?.name || 'selected apartment' }}</p>
      </div>

      @if (!currentApartment()) {
        <div class="empty-state">
          <div class="empty-icon">🚪</div>
          <h3>No apartment selected</h3>
          <p>Select an apartment from the dropdown above to manage rooms</p>
        </div>
      } @else {
        <div class="rooms-content">
          <app-room-list
            [rooms]="currentApartment()!.rooms"
            (roomAdded)="onRoomAdded($event)"
            (roomUpdated)="onRoomUpdated($event)"
            (roomRemoved)="onRoomRemoved($event)"
          />
        </div>
      }
    </div>
  `,
  styles: [`
    .rooms-page {
      padding: var(--spacing-xl);
      min-height: 100%;
    }

    .page-header {
      margin-bottom: var(--spacing-xl);
    }

    .page-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-sm) 0;
    }

    .page-subtitle {
      color: var(--color-text-secondary);
      margin: 0;
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

    .rooms-content {
      max-width: 800px;
    }

    @media (max-width: 768px) {
      .rooms-page {
        padding: var(--spacing-md);
        padding-left: max(var(--spacing-md), env(safe-area-inset-left));
        padding-right: max(var(--spacing-md), env(safe-area-inset-right));
      }

      .page-header h1 {
        font-size: 1.5rem;
      }
    }
  `],
})
export class RoomsComponent {
  private apartmentService = inject(ApartmentService);

  currentApartment = this.apartmentService.currentApartment;

  onRoomAdded(event: { name: string; rentMin: number; rentMax: number }): void {
    const apartment = this.currentApartment();
    if (!apartment) return;
    this.apartmentService.addRoom(apartment.id, {
      name: event.name,
      rentMin: event.rentMin,
      rentMax: event.rentMax,
      isTaken: false,
    });
  }

  onRoomUpdated(event: { id: string; updates: Partial<any> }): void {
    const apartment = this.currentApartment();
    if (!apartment) return;
    this.apartmentService.updateRoom(apartment.id, event.id, event.updates);
  }

  onRoomRemoved(roomId: string): void {
    const apartment = this.currentApartment();
    if (!apartment) return;
    this.apartmentService.removeRoom(apartment.id, roomId);
  }
}
