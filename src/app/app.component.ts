import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from './components/header/app-header.component';
import { AppSidebarComponent } from './components/sidebar/app-sidebar.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, AppHeaderComponent, AppSidebarComponent],
  template: `
    <div class="app-container">
      <app-header />
      <div class="app-layout">
        <app-sidebar />
        <main class="app-main">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--color-bg-primary);
    }

    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    .app-layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .app-main {
      flex: 1;
      overflow-y: auto;
      background: var(--color-bg-secondary);
    }
  `],
})
export class AppComponent {}
