import { Component, inject, signal, ChangeDetectionStrategy, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CloudSyncService } from '../../services/cloud-sync.service';

@Component({
  selector: 'app-cloud-sync-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="cloud-sync-modal" (click)="onBackdropClick($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Cloud Sync Settings</h2>
          <button class="btn-close" (click)="close.emit()">✕</button>
        </div>

        <div class="modal-body">
          <div class="sync-status">
            <div class="status-indicator" [class.active]="syncEnabled()">
              <span class="status-dot"></span>
              <span class="status-text">{{ syncEnabled() ? 'Cloud Sync Enabled' : 'Cloud Sync Disabled' }}</span>
            </div>
          </div>

          @if (!syncEnabled()) {
            <div class="setup-section">
              <h3>Setup Firebase Cloud Sync</h3>
              <p class="help-text">
                To enable cloud sync, you need to create a Firebase project and provide your configuration.
                Your data will be automatically synced across all your devices.
              </p>

              <div class="form-group">
                <label>API Key</label>
                <input type="text" [(ngModel)]="apiKey" placeholder="AIza..." />
              </div>

              <div class="form-group">
                <label>Auth Domain</label>
                <input type="text" [(ngModel)]="authDomain" placeholder="your-project.firebaseapp.com" />
              </div>

              <div class="form-group">
                <label>Project ID</label>
                <input type="text" [(ngModel)]="projectId" placeholder="your-project-id" />
              </div>

              <div class="form-group">
                <label>Storage Bucket</label>
                <input type="text" [(ngModel)]="storageBucket" placeholder="your-project.appspot.com" />
              </div>

              <div class="form-group">
                <label>Messaging Sender ID</label>
                <input type="text" [(ngModel)]="messagingSenderId" placeholder="123456789" />
              </div>

              <div class="form-group">
                <label>App ID</label>
                <input type="text" [(ngModel)]="appId" placeholder="1:123456789:web:..." />
              </div>

              <div class="form-actions">
                <button class="btn-primary" (click)="enableSync()">Enable Cloud Sync</button>
                <button class="btn-secondary" (click)="close.emit()">Cancel</button>
              </div>
            </div>
          } @else {
            <div class="info-section">
              <p class="info-text">
                Cloud sync is enabled. Your data is automatically saved to the cloud and synced across all devices.
              </p>
              <p class="user-id">
                <strong>User ID:</strong> {{ userId() }}
              </p>
              <div class="form-actions">
                <button class="btn-danger" (click)="disableSync()">Disable Cloud Sync</button>
                <button class="btn-secondary" (click)="close.emit()">Close</button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cloud-sync-modal {
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
      border-radius: var(--border-radius-xl);
      box-shadow: var(--shadow-xl);
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
      font-size: 1.5rem;
      font-weight: 700;
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
    }

    .btn-close:hover {
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
    }

    .modal-body {
      padding: var(--spacing-lg);
    }

    .sync-status {
      margin-bottom: var(--spacing-xl);
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      border-radius: var(--border-radius-md);
      background: var(--color-bg-secondary);
    }

    .status-indicator.active {
      background: rgba(16, 185, 129, 0.1);
    }

    .status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--color-text-tertiary);
    }

    .status-indicator.active .status-dot {
      background: var(--color-success);
    }

    .status-text {
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .setup-section h3 {
      margin: 0 0 var(--spacing-md) 0;
      color: var(--color-text-primary);
      font-size: 1.1rem;
    }

    .help-text {
      color: var(--color-text-secondary);
      margin: 0 0 var(--spacing-lg) 0;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .form-group {
      margin-bottom: var(--spacing-md);
    }

    .form-group label {
      display: block;
      margin-bottom: var(--spacing-xs);
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .form-group input {
      width: 100%;
      padding: var(--spacing-sm) var(--spacing-md);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-md);
      background: var(--color-card-bg);
      color: var(--color-text-primary);
      font-size: 0.9rem;
      font-family: inherit;
      transition: all 0.2s ease;
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .info-section {
      margin-top: var(--spacing-lg);
    }

    .info-text {
      color: var(--color-text-secondary);
      margin: 0 0 var(--spacing-md) 0;
      line-height: 1.5;
    }

    .user-id {
      padding: var(--spacing-md);
      background: var(--color-bg-secondary);
      border-radius: var(--border-radius-md);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-lg) 0;
      word-break: break-all;
    }

    .form-actions {
      display: flex;
      gap: var(--spacing-md);
      justify-content: flex-end;
      margin-top: var(--spacing-xl);
    }

    .btn-primary {
      padding: var(--spacing-sm) var(--spacing-lg);
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

    .btn-primary:hover {
      background: var(--color-primary-dark);
    }

    .btn-secondary {
      padding: var(--spacing-sm) var(--spacing-lg);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-md);
      background: transparent;
      color: var(--color-text-secondary);
      font-size: 0.9rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-secondary:hover {
      border-color: var(--color-border-light);
      color: var(--color-text-primary);
    }

    .btn-danger {
      padding: var(--spacing-sm) var(--spacing-lg);
      border: none;
      border-radius: var(--border-radius-md);
      background: var(--color-error);
      color: white;
      font-size: 0.9rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-danger:hover {
      background: var(--color-error-dark);
    }
  `],
})
export class CloudSyncSettingsComponent {
  cloudSync = inject(CloudSyncService);
  
  syncEnabled = this.cloudSync.syncEnabled$;
  userId = signal(this.cloudSync.getUserId());
  
  apiKey = '';
  authDomain = '';
  projectId = '';
  storageBucket = '';
  messagingSenderId = '';
  appId = '';

  close = output<void>();

  enableSync(): void {
    if (this.projectId && this.apiKey) {
      const config = {
        apiKey: this.apiKey,
        authDomain: this.authDomain,
        projectId: this.projectId,
        storageBucket: this.storageBucket,
        messagingSenderId: this.messagingSenderId,
        appId: this.appId,
      };
      this.cloudSync.enableSync(config);
    } else {
      alert('Please fill in all required Firebase configuration fields.');
    }
  }

  disableSync(): void {
    if (confirm('Are you sure you want to disable cloud sync? Your data will only be stored locally.')) {
      this.cloudSync.disableSync();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}
