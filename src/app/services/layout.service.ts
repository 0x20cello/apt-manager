import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly mobileMenuOpen = signal(false);
  readonly showGoogleDriveModal = signal(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  openGoogleDriveModal(): void {
    this.showGoogleDriveModal.set(true);
  }

  closeGoogleDriveModal(): void {
    this.showGoogleDriveModal.set(false);
  }
}
