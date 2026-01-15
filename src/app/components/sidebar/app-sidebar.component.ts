import { Component, inject, signal, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ApartmentService } from '../../services/apartment.service';
import { CloudSyncService } from '../../services/cloud-sync.service';
import { CloudSyncSettingsComponent } from '../cloud-sync-settings/cloud-sync-settings.component';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, RouterLinkActive, CloudSyncSettingsComponent],
  template: `
    <aside class="sidebar">
      <nav class="sidebar-nav">
        <h3 class="nav-section-title">Navigation</h3>
        <ul class="nav-list">
          <li class="nav-item">
            <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
              <span class="nav-icon">📊</span>
              Dashboard
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/expenses" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">💼</span>
              Expenses
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/rooms" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">🚪</span>
              Rooms
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/tenants" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">👥</span>
              Tenants
            </a>
          </li>
        </ul>
      </nav>

      <div class="sidebar-forms">
        <section class="form-section">
          <h3 class="form-section-title">Add Apartment</h3>
          <div class="input-group">
            <input
              type="text"
              [(ngModel)]="newApartmentName"
              placeholder="Apartment name..."
              (keydown.enter)="addApartment()"
            />
            <button class="btn-primary" (click)="addApartment()" [disabled]="!newApartmentName().trim()">
              <span class="icon">+</span> Add
            </button>
          </div>
        </section>

        <section class="form-section settings-section">
          <h3 class="form-section-title">Data Management</h3>
          <div class="settings-actions">
            <button class="btn-settings" (click)="exportData()">
              <span class="icon">📥</span> Export JSON
            </button>
            <button class="btn-settings" (click)="triggerImport()">
              <span class="icon">📤</span> Import JSON
            </button>
            <button class="btn-settings" (click)="showCloudSync.set(true)" [class.active]="syncEnabled()">
              <span class="icon">☁️</span> Cloud Sync
              @if (syncEnabled()) {
                <span class="sync-indicator"></span>
              }
            </button>
            <input
              type="file"
              #fileInput
              accept=".json"
              (change)="importData($event)"
              style="display: none;"
            />
          </div>
        </section>
      </div>

      @if (showCloudSync()) {
        <app-cloud-sync-settings (close)="showCloudSync.set(false)" />
      }
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 280px;
      background: var(--color-card-bg);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow-y: auto;
    }

    .sidebar-nav {
      padding: var(--spacing-lg);
      border-bottom: 1px solid var(--color-border);
    }

    .nav-section-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 var(--spacing-md) 0;
    }

    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .nav-item {
      margin-bottom: var(--spacing-xs);
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      color: var(--color-text-secondary);
      text-decoration: none;
      border-radius: var(--border-radius-md);
      transition: all 0.2s ease;
      font-size: 0.9rem;
    }

    .nav-link:hover {
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
    }

    .nav-item .nav-link.active {
      background: var(--color-primary);
      color: white;
    }

    .nav-icon {
      font-size: 1.1rem;
    }

    .sidebar-forms {
      padding: var(--spacing-lg);
      flex: 1;
    }

    .form-section {
      margin-bottom: var(--spacing-xl);
    }

    .form-section-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-md) 0;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .input-group input {
      padding: var(--spacing-sm) var(--spacing-md);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-md);
      background: var(--color-card-bg);
      color: var(--color-text-primary);
      font-size: 0.9rem;
      font-family: inherit;
      transition: all 0.2s ease;
    }

    .input-group input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .input-group input::placeholder {
      color: var(--color-text-tertiary);
    }

    .btn-primary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      border: none;
      border-radius: var(--border-radius-md);
      background: var(--color-primary);
      color: white;
      font-size: 0.9rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--color-primary-dark);
      transform: translateY(-1px);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .icon {
      font-size: 1rem;
    }

    .settings-section {
      border-top: 1px solid var(--color-border);
      padding-top: var(--spacing-lg);
      margin-top: var(--spacing-lg);
    }

    .settings-actions {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .btn-settings {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-md);
      background: var(--color-card-bg);
      color: var(--color-text-primary);
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
    }

    .btn-settings:hover {
      background: var(--color-bg-secondary);
      border-color: var(--color-primary-light);
    }

    .btn-settings.active {
      background: rgba(16, 185, 129, 0.1);
      border-color: var(--color-success);
    }

    .sync-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-success);
      margin-left: auto;
    }

    .empty-state {
      padding: var(--spacing-md);
      text-align: center;
      color: var(--color-text-tertiary);
      font-size: 0.9rem;
    }
  `],
})
export class AppSidebarComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  private apartmentService = inject(ApartmentService);
  private cloudSync = inject(CloudSyncService);

  newApartmentName = signal('');
  showCloudSync = signal(false);
  syncEnabled = this.cloudSync.syncEnabled$;

  addApartment(): void {
    const name = this.newApartmentName().trim();
    if (name) {
      this.apartmentService.addApartment(name);
      this.newApartmentName.set('');
    }
  }

  exportData(): void {
    const data = this.apartmentService.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `apartment-manager-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  triggerImport(): void {
    this.fileInput.nativeElement.click();
  }

  importData(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
          if (confirm('This will replace all current data. Are you sure?')) {
            this.apartmentService.importData(data);
            input.value = '';
          }
        } else {
          alert('Invalid JSON format. Expected an array of apartments.');
        }
      } catch (error) {
        alert('Error parsing JSON file. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }
}
