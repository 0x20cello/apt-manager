import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from './components/header/app-header.component';
import { AppSidebarComponent } from './components/sidebar/app-sidebar.component';
import { GoogleDriveSettingsComponent } from './components/google-drive-settings/google-drive-settings.component';
import { LayoutService } from './services/layout.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, AppHeaderComponent, AppSidebarComponent, GoogleDriveSettingsComponent],
  template: `
    <div class="app-container" [class.sidebar-open]="layout.mobileMenuOpen()">
      <div class="backdrop" (click)="layout.closeMobileMenu()"></div>
      <app-header />
      <div class="app-layout">
        <app-sidebar />
        <main class="app-main">
          <router-outlet />
        </main>
      </div>
    </div>
    @if (layout.showGoogleDriveModal()) {
      <app-google-drive-settings (close)="layout.closeGoogleDriveModal()" />
    }
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      min-height: 100dvh;
      background: var(--color-bg-primary);
    }

    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      height: 100dvh;
      overflow: hidden;
    }

    .backdrop {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }

    @media (max-width: 768px) {
      .app-container.sidebar-open .backdrop {
        display: block;
        opacity: 1;
        pointer-events: auto;
      }
    }

    @media (min-width: 769px) {
      .backdrop {
        display: none !important;
      }
    }

    .app-layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .app-main {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      background: var(--color-bg-secondary);
    }

    @media (max-width: 768px) {
      .app-main {
        padding-left: env(safe-area-inset-left);
        padding-right: env(safe-area-inset-right);
        padding-bottom: env(safe-area-inset-bottom);
      }
    }
  `],
})
export class AppComponent {
  layout = inject(LayoutService);
}
