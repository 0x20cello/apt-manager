import { Injectable, signal, effect } from '@angular/core';
import { Apartment } from '../models/apartment.model';
import { FirebaseService } from './firebase.service';
import { generateUUID } from '../utils/uuid.util';

const USER_ID_KEY = 'apartment-manager-user-id';
const SYNC_ENABLED_KEY = 'cloud-sync-enabled';

@Injectable({ providedIn: 'root' })
export class CloudSyncService {
  private syncEnabled = signal<boolean>(this.loadSyncEnabled());
  private userId = this.getOrCreateUserId();
  private isSyncing = false;

  readonly syncEnabled$ = this.syncEnabled.asReadonly();

  constructor(private firebase: FirebaseService) {
    this.firebase.initialize();

    effect(() => {
      if (this.syncEnabled()) {
        this.setupRealtimeSync();
      } else {
        this.firebase.unsubscribeFromApartments();
      }
    });
  }

  private getOrCreateUserId(): string {
    let userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) {
      userId = generateUUID();
      localStorage.setItem(USER_ID_KEY, userId);
    }
    return userId;
  }

  private loadSyncEnabled(): boolean {
    const stored = localStorage.getItem(SYNC_ENABLED_KEY);
    return stored === 'true';
  }

  enableSync(firebaseConfig?: any): void {
    if (firebaseConfig) {
      this.firebase.setFirebaseConfig(firebaseConfig);
    }
    this.syncEnabled.set(true);
    localStorage.setItem(SYNC_ENABLED_KEY, 'true');
  }

  disableSync(): void {
    this.syncEnabled.set(false);
    localStorage.setItem(SYNC_ENABLED_KEY, 'false');
    this.firebase.unsubscribeFromApartments();
  }

  async syncToCloud(apartments: Apartment[]): Promise<void> {
    if (!this.syncEnabled() || this.isSyncing) {
      return;
    }

    if (!this.firebase.isConfigured()) {
      return;
    }

    this.isSyncing = true;
    try {
      await this.firebase.saveApartments(apartments, this.userId);
    } catch (error) {
      console.error('Cloud sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  async syncFromCloud(): Promise<Apartment[] | null> {
    if (!this.syncEnabled() || !this.firebase.isConfigured()) {
      return null;
    }

    try {
      return await this.firebase.loadApartments(this.userId);
    } catch (error) {
      console.error('Cloud load error:', error);
      return null;
    }
  }

  private setupRealtimeSync(): void {
    if (!this.firebase.isConfigured()) {
      return;
    }

    this.firebase.subscribeToApartments(this.userId, (apartments) => {
      if (!this.isSyncing && apartments.length > 0) {
        const event = new CustomEvent('cloud-sync-update', { detail: apartments });
        window.dispatchEvent(event);
      }
    });
  }

  getUserId(): string {
    return this.userId;
  }
}
