import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ApartmentService } from '../../services/apartment.service';
import { TenantListComponent } from '../tenant-list/tenant-list.component';

@Component({
  selector: 'app-tenants',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TenantListComponent],
  template: `
    <div class="tenants-page">
      <div class="page-header">
        <h1>Tenants</h1>
        <p class="page-subtitle">Manage tenants for {{ currentApartment()?.name || 'selected apartment' }}</p>
      </div>

      @if (!currentApartment()) {
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <h3>No apartment selected</h3>
          <p>Select an apartment from the dropdown above to manage tenants</p>
        </div>
      } @else {
        <div class="tenants-content">
          <app-tenant-list
            [tenants]="currentApartment()!.tenants"
            [rooms]="currentApartment()!.rooms"
            (tenantAdded)="onTenantAdded($event)"
            (tenantUpdated)="onTenantUpdated($event)"
            (tenantRemoved)="onTenantRemoved($event)"
          />
        </div>
      }
    </div>
  `,
  styles: [`
    .tenants-page {
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

    .tenants-content {
      max-width: 800px;
    }
  `],
})
export class TenantsComponent {
  private apartmentService = inject(ApartmentService);

  currentApartment = this.apartmentService.currentApartment;

  onTenantAdded(tenant: any): void {
    const apartment = this.currentApartment();
    if (!apartment) return;
    this.apartmentService.addTenant(apartment.id, tenant);
  }

  onTenantUpdated(event: { id: string; updates: Partial<any> }): void {
    const apartment = this.currentApartment();
    if (!apartment) return;
    this.apartmentService.updateTenant(apartment.id, event.id, event.updates);
  }

  onTenantRemoved(tenantId: string): void {
    const apartment = this.currentApartment();
    if (!apartment) return;
    this.apartmentService.removeTenant(apartment.id, tenantId);
  }
}
