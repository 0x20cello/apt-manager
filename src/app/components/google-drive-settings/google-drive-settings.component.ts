import { Component, inject, signal, ChangeDetectionStrategy, output, effect, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GoogleDriveService } from '../../services/google-drive.service';

@Component({
  selector: 'app-google-drive-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="gdrive-modal" (click)="onBackdropClick($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Google Drive</h2>
          <button type="button" class="btn-close" (click)="close.emit()">✕</button>
        </div>
        <div class="modal-body">
          <p class="help-text">
            Save part-manager.json to your Google Drive root. After connecting, every save will sync to Drive in the background.
          </p>
          <div class="form-group">
            <label>Google Client ID</label>
            <input
              type="text"
              [ngModel]="clientIdInput()"
              (ngModelChange)="clientIdInput.set($event)"
              placeholder="xxx.apps.googleusercontent.com"
            />
          </div>
          @if (lastError()) {
            <p class="error-text">{{ lastError() }}</p>
          }
          @if (connected()) {
            <div class="status connected">
              <span class="status-dot"></span>
              <span>Connected to Google Drive</span>
              @if (isSaving()) {
                <span class="saving">Saving…</span>
              }
            </div>
            <div class="form-actions">
              <button type="button" class="btn-danger" (click)="disconnect()">Disconnect</button>
              <button type="button" class="btn-secondary" (click)="close.emit()">Close</button>
            </div>
          } @else {
            <div class="form-actions">
              <button type="button" class="btn-primary" (click)="connect()">Connect Google Drive</button>
              <button type="button" class="btn-secondary" (click)="close.emit()">Cancel</button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .gdrive-modal {
      position: fixed;
      inset: 0;
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
      max-width: 480px;
      width: 100%;
    }

    @media (max-width: 768px) {
      .gdrive-modal {
        padding: var(--spacing-md);
        padding-left: max(var(--spacing-md), env(safe-area-inset-left));
        padding-right: max(var(--spacing-md), env(safe-area-inset-right));
        align-items: flex-start;
      }

      .modal-content {
        max-height: calc(100vh - 2 * var(--spacing-md) - env(safe-area-inset-top) - env(safe-area-inset-bottom));
        overflow-y: auto;
      }

      .btn-close {
        min-width: 44px;
        min-height: 44px;
      }
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
    }
    .btn-close:hover {
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
    }
    .modal-body {
      padding: var(--spacing-lg);
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
    }
    .form-group input:focus {
      outline: none;
      border-color: var(--color-primary);
    }
    .error-text {
      color: var(--color-error);
      font-size: 0.875rem;
      margin: 0 0 var(--spacing-md) 0;
    }
    .status {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      border-radius: var(--border-radius-md);
      background: var(--color-bg-secondary);
      margin-bottom: var(--spacing-lg);
    }
    .status.connected {
      background: rgba(16, 185, 129, 0.1);
    }
    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--color-text-tertiary);
    }
    .status.connected .status-dot {
      background: var(--color-success);
    }
    .saving {
      margin-left: auto;
      font-size: 0.85rem;
      color: var(--color-text-secondary);
    }
    .form-actions {
      display: flex;
      gap: var(--spacing-md);
      justify-content: flex-end;
    }
    .btn-primary {
      padding: var(--spacing-sm) var(--spacing-lg);
      border: none;
      border-radius: var(--border-radius-md);
      background: var(--color-primary);
      color: white;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
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
      cursor: pointer;
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
      cursor: pointer;
    }
    .btn-danger:hover {
      background: var(--color-error-dark);
    }
  `],
})
export class GoogleDriveSettingsComponent implements OnInit {
  private gdrive = inject(GoogleDriveService);

  clientIdInput = signal('');
  connected = this.gdrive.connected;
  lastError = this.gdrive.lastError;
  isSaving = this.gdrive.isSaving;
  close = output<void>();

  constructor() {
    effect(() => {
      const id = this.gdrive.clientId();
      this.clientIdInput.set(id);
    });
  }

  ngOnInit(): void {
    this.gdrive.tryRestoreSession();
  }

  connect(): void {
    const id = this.clientIdInput().trim();
    if (id) {
      this.gdrive.setClientId(id);
    }
    this.gdrive.connect();
  }

  disconnect(): void {
    this.gdrive.disconnect();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}
