import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { Apartment } from '../models/apartment.model';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private unsubscribe: Unsubscribe | null = null;
  private isInitialized = false;

  initialize(): void {
    if (this.isInitialized) return;

    try {
      const config = this.getFirebaseConfig();
      if (!config || !config.projectId || config.projectId === 'YOUR_PROJECT_ID') {
        console.warn('Firebase not configured. Using localStorage only.');
        return;
      }

      this.app = initializeApp(config);
      this.db = getFirestore(this.app);
      this.isInitialized = true;
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  }

  private getFirebaseConfig() {
    const stored = localStorage.getItem('firebase-config');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return firebaseConfig;
      }
    }
    return firebaseConfig;
  }

  setFirebaseConfig(config: any): void {
    localStorage.setItem('firebase-config', JSON.stringify(config));
    this.isInitialized = false;
    this.initialize();
  }

  async saveApartments(apartments: Apartment[], userId: string): Promise<void> {
    if (!this.db || !this.isInitialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      const docRef = doc(this.db, 'users', userId);
      await setDoc(docRef, {
        apartments,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      throw error;
    }
  }

  async loadApartments(userId: string): Promise<Apartment[] | null> {
    if (!this.db || !this.isInitialized) {
      return null;
    }

    try {
      const docRef = doc(this.db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return data['apartments'] || null;
      }
      return null;
    } catch (error) {
      console.error('Error loading from Firebase:', error);
      return null;
    }
  }

  subscribeToApartments(userId: string, callback: (apartments: Apartment[]) => void): void {
    if (!this.db || !this.isInitialized) {
      return;
    }

    if (this.unsubscribe) {
      this.unsubscribe();
    }

    try {
      const docRef = doc(this.db, 'users', userId);
      this.unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          callback(data['apartments'] || []);
        }
      });
    } catch (error) {
      console.error('Error subscribing to Firebase:', error);
    }
  }

  unsubscribeFromApartments(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  isConfigured(): boolean {
    return this.isInitialized && this.db !== null;
  }
}
