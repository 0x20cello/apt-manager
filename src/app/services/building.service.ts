import { Injectable, signal, computed } from '@angular/core';
import { Building } from '../models/building.model';
import { Apartment } from '../models/apartment.model';

const STORAGE_KEY = 'building-manager-data';
const CURRENT_BUILDING_KEY = 'current-building-id';

@Injectable({ providedIn: 'root' })
export class BuildingService {
  private readonly buildingsSignal = signal<Building[]>(this.loadFromStorage());
  private readonly currentBuildingIdSignal = signal<string | null>(
    this.loadCurrentBuildingId()
  );

  readonly buildings = this.buildingsSignal.asReadonly();
  readonly currentBuildingId = this.currentBuildingIdSignal.asReadonly();

  readonly currentBuilding = computed(() => {
    const id = this.currentBuildingIdSignal();
    if (!id) return null;
    return this.buildingsSignal().find((b) => b.id === id) || null;
  });

  private loadFromStorage(): Building[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private loadCurrentBuildingId(): string | null {
    return localStorage.getItem(CURRENT_BUILDING_KEY);
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.buildingsSignal()));
  }

  private saveCurrentBuildingId(id: string | null): void {
    if (id) {
      localStorage.setItem(CURRENT_BUILDING_KEY, id);
    } else {
      localStorage.removeItem(CURRENT_BUILDING_KEY);
    }
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  getBuildings(): Building[] {
    return this.buildingsSignal();
  }

  getBuilding(id: string): Building | undefined {
    return this.buildingsSignal().find((b) => b.id === id);
  }

  getCurrentBuilding(): Building | null {
    return this.currentBuilding();
  }

  setCurrentBuilding(id: string | null): void {
    this.currentBuildingIdSignal.set(id);
    this.saveCurrentBuildingId(id);
  }

  addBuilding(name: string): Building {
    const building: Building = {
      id: this.generateId(),
      name,
      apartments: [],
    };
    this.buildingsSignal.update((buildings) => [...buildings, building]);
    this.saveToStorage();
    
    if (!this.currentBuildingIdSignal()) {
      this.setCurrentBuilding(building.id);
    }
    
    return building;
  }

  removeBuilding(id: string): void {
    this.buildingsSignal.update((buildings) => buildings.filter((b) => b.id !== id));
    this.saveToStorage();
    
    if (this.currentBuildingIdSignal() === id) {
      const remaining = this.buildingsSignal();
      this.setCurrentBuilding(remaining.length > 0 ? remaining[0].id : null);
    }
  }

  updateBuildingName(id: string, name: string): void {
    this.buildingsSignal.update((buildings) =>
      buildings.map((b) => (b.id === id ? { ...b, name } : b))
    );
    this.saveToStorage();
  }

  addApartment(buildingId: string, apartment: Apartment): void {
    this.buildingsSignal.update((buildings) =>
      buildings.map((b) =>
        b.id === buildingId
          ? { ...b, apartments: [...b.apartments, apartment] }
          : b
      )
    );
    this.saveToStorage();
  }

  updateApartment(buildingId: string, apartmentId: string, updates: Partial<Apartment>): void {
    this.buildingsSignal.update((buildings) =>
      buildings.map((b) =>
        b.id === buildingId
          ? {
              ...b,
              apartments: b.apartments.map((a) =>
                a.id === apartmentId ? { ...a, ...updates } : a
              ),
            }
          : b
      )
    );
    this.saveToStorage();
  }

  removeApartment(buildingId: string, apartmentId: string): void {
    this.buildingsSignal.update((buildings) =>
      buildings.map((b) =>
        b.id === buildingId
          ? { ...b, apartments: b.apartments.filter((a) => a.id !== apartmentId) }
          : b
      )
    );
    this.saveToStorage();
  }

  addRoom(buildingId: string, apartmentId: string, room: any): void {
    this.buildingsSignal.update((buildings) =>
      buildings.map((b) =>
        b.id === buildingId
          ? {
              ...b,
              apartments: b.apartments.map((a) =>
                a.id === apartmentId
                  ? { ...a, rooms: [...a.rooms, { ...room, id: this.generateId() }] }
                  : a
              ),
            }
          : b
      )
    );
    this.saveToStorage();
  }

  updateRoom(buildingId: string, apartmentId: string, roomId: string, updates: any): void {
    this.buildingsSignal.update((buildings) =>
      buildings.map((b) =>
        b.id === buildingId
          ? {
              ...b,
              apartments: b.apartments.map((a) =>
                a.id === apartmentId
                  ? {
                      ...a,
                      rooms: a.rooms.map((r) =>
                        r.id === roomId ? { ...r, ...updates } : r
                      ),
                    }
                  : a
              ),
            }
          : b
      )
    );
    this.saveToStorage();
  }

  removeRoom(buildingId: string, apartmentId: string, roomId: string): void {
    this.buildingsSignal.update((buildings) =>
      buildings.map((b) =>
        b.id === buildingId
          ? {
              ...b,
              apartments: b.apartments.map((a) =>
                a.id === apartmentId
                  ? { ...a, rooms: a.rooms.filter((r) => r.id !== roomId) }
                  : a
              ),
            }
          : b
      )
    );
    this.saveToStorage();
  }

  addExpense(buildingId: string, apartmentId: string, expense: any): void {
    this.buildingsSignal.update((buildings) =>
      buildings.map((b) =>
        b.id === buildingId
          ? {
              ...b,
              apartments: b.apartments.map((a) =>
                a.id === apartmentId
                  ? { ...a, expenses: [...a.expenses, { ...expense, id: this.generateId() }] }
                  : a
              ),
            }
          : b
      )
    );
    this.saveToStorage();
  }

  updateExpense(buildingId: string, apartmentId: string, expenseId: string, updates: any): void {
    this.buildingsSignal.update((buildings) =>
      buildings.map((b) =>
        b.id === buildingId
          ? {
              ...b,
              apartments: b.apartments.map((a) =>
                a.id === apartmentId
                  ? {
                      ...a,
                      expenses: a.expenses.map((e) =>
                        e.id === expenseId ? { ...e, ...updates } : e
                      ),
                    }
                  : a
              ),
            }
          : b
      )
    );
    this.saveToStorage();
  }

  removeExpense(buildingId: string, apartmentId: string, expenseId: string): void {
    this.buildingsSignal.update((buildings) =>
      buildings.map((b) =>
        b.id === buildingId
          ? {
              ...b,
              apartments: b.apartments.map((a) =>
                a.id === apartmentId
                  ? { ...a, expenses: a.expenses.filter((e) => e.id !== expenseId) }
                  : a
              ),
            }
          : b
      )
    );
    this.saveToStorage();
  }

  exportData(): string {
    return JSON.stringify(this.buildingsSignal(), null, 2);
  }

  importData(data: Building[]): void {
    this.buildingsSignal.set(data);
    this.saveToStorage();
    
    if (data.length > 0 && !this.currentBuildingIdSignal()) {
      this.setCurrentBuilding(data[0].id);
    }
  }

  migrateFromApartments(apartments: Apartment[]): void {
    if (apartments.length === 0) return;

    const defaultBuilding: Building = {
      id: this.generateId(),
      name: 'Default Building',
      apartments: apartments.map((apt) => ({ ...apt, buildingId: undefined })),
    };

    this.buildingsSignal.set([defaultBuilding]);
    this.setCurrentBuilding(defaultBuilding.id);
    this.saveToStorage();
  }
}
