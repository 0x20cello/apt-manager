import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Apartment, Room, Expense, ApartmentMetrics, ExpenseCadence, Tenant } from '../models/apartment.model';
import { CloudSyncService } from './cloud-sync.service';

const STORAGE_KEY = 'apartment-manager-data';
const CURRENT_APARTMENT_KEY = 'current-apartment-id';

@Injectable({ providedIn: 'root' })
export class ApartmentService {
    private cloudSync = inject(CloudSyncService);

    private readonly apartmentsSignal = signal<Apartment[]>(this.loadFromStorage());
    private readonly currentApartmentIdSignal = signal<string | null>(
        this.loadCurrentApartmentId()
    );

    readonly apartments = this.apartmentsSignal.asReadonly();
    readonly currentApartmentId = this.currentApartmentIdSignal.asReadonly();

    readonly currentApartment = computed(() => {
        const id = this.currentApartmentIdSignal();
        if (!id) return null;
        return this.apartmentsSignal().find((a) => a.id === id) || null;
    });

    private isSyncingToCloud = false;

    constructor() {
        this.initializeCloudSync();
        
        effect(() => {
            const apartments = this.apartmentsSignal();
            if (!this.isSyncingToCloud) {
                this.cloudSync.syncToCloud(apartments);
            }
        });
    }

    private async initializeCloudSync(): Promise<void> {
        window.addEventListener('cloud-sync-update', ((event: CustomEvent<Apartment[]>) => {
            const cloudData = event.detail;
            if (cloudData && cloudData.length >= 0) {
                this.isSyncingToCloud = true;
                const currentId = this.currentApartmentIdSignal();
                this.apartmentsSignal.set(cloudData);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
                if (currentId) {
                    this.setCurrentApartment(currentId);
                }
                setTimeout(() => {
                    this.isSyncingToCloud = false;
                }, 100);
            }
        }) as EventListener);

        const cloudData = await this.cloudSync.syncFromCloud();
        if (cloudData && cloudData.length > 0) {
            const localData = this.apartmentsSignal();
            if (localData.length === 0 || this.isCloudDataNewer(cloudData, localData)) {
                this.isSyncingToCloud = true;
                this.apartmentsSignal.set(cloudData);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
                setTimeout(() => {
                    this.isSyncingToCloud = false;
                }, 100);
            }
        }
    }

    private isCloudDataNewer(cloudData: Apartment[], localData: Apartment[]): boolean {
        return cloudData.length > localData.length;
    }

    private loadFromStorage(): Apartment[] {
        const data = localStorage.getItem(STORAGE_KEY);
        const apartments = data ? JSON.parse(data) : [];
        return apartments.map((apt: Apartment) => ({
            ...apt,
            tenants: apt.tenants || [],
        }));
    }

    private loadCurrentApartmentId(): string | null {
        return localStorage.getItem(CURRENT_APARTMENT_KEY);
    }

    private saveToStorage(): void {
        const data = JSON.stringify(this.apartmentsSignal());
        localStorage.setItem(STORAGE_KEY, data);
    }

    private saveCurrentApartmentId(id: string | null): void {
        if (id) {
            localStorage.setItem(CURRENT_APARTMENT_KEY, id);
        } else {
            localStorage.removeItem(CURRENT_APARTMENT_KEY);
        }
    }

    private generateId(): string {
        return crypto.randomUUID();
    }

    getCurrentApartment(): Apartment | null {
        return this.currentApartment();
    }

    setCurrentApartment(id: string | null): void {
        this.currentApartmentIdSignal.set(id);
        this.saveCurrentApartmentId(id);
    }

    addApartment(name: string): void {
        const apartment: Apartment = {
            id: this.generateId(),
            name,
            rooms: [],
            expenses: [],
            tenants: [],
        };
        this.apartmentsSignal.update((apts) => [...apts, apartment]);
        this.saveToStorage();
        
        if (!this.currentApartmentIdSignal()) {
            this.setCurrentApartment(apartment.id);
        }
    }

    removeApartment(id: string): void {
        this.apartmentsSignal.update((apts) => apts.filter((a) => a.id !== id));
        this.saveToStorage();
        
        if (this.currentApartmentIdSignal() === id) {
            const remaining = this.apartmentsSignal();
            this.setCurrentApartment(remaining.length > 0 ? remaining[0].id : null);
        }
    }

    updateApartmentName(id: string, name: string): void {
        this.apartmentsSignal.update((apts) =>
            apts.map((a) => (a.id === id ? { ...a, name } : a))
        );
        this.saveToStorage();
    }

    addRoom(apartmentId: string, room: Omit<Room, 'id'>): void {
        const newRoom: Room = { ...room, id: this.generateId() };
        this.apartmentsSignal.update((apts) =>
            apts.map((a) =>
                a.id === apartmentId ? { ...a, rooms: [...a.rooms, newRoom] } : a
            )
        );
        this.saveToStorage();
    }

    updateRoom(apartmentId: string, roomId: string, updates: Partial<Omit<Room, 'id'>>): void {
        this.apartmentsSignal.update((apts) =>
            apts.map((a) =>
                a.id === apartmentId
                    ? {
                        ...a,
                        rooms: a.rooms.map((r) =>
                            r.id === roomId ? { ...r, ...updates } : r
                        ),
                    }
                    : a
            )
        );
        this.saveToStorage();
    }

    removeRoom(apartmentId: string, roomId: string): void {
        this.apartmentsSignal.update((apts) =>
            apts.map((a) =>
                a.id === apartmentId
                    ? { ...a, rooms: a.rooms.filter((r) => r.id !== roomId) }
                    : a
            )
        );
        this.saveToStorage();
    }

    addExpense(apartmentId: string, expense: Omit<Expense, 'id'>): void {
        const newExpense: Expense = { ...expense, id: this.generateId() };
        this.apartmentsSignal.update((apts) =>
            apts.map((a) =>
                a.id === apartmentId
                    ? { ...a, expenses: [...a.expenses, newExpense] }
                    : a
            )
        );
        this.saveToStorage();
    }

    updateExpense(apartmentId: string, expenseId: string, updates: Partial<Omit<Expense, 'id'>>): void {
        this.apartmentsSignal.update((apts) =>
            apts.map((a) =>
                a.id === apartmentId
                    ? {
                        ...a,
                        expenses: a.expenses.map((e) =>
                            e.id === expenseId ? { ...e, ...updates } : e
                        ),
                    }
                    : a
            )
        );
        this.saveToStorage();
    }

    removeExpense(apartmentId: string, expenseId: string): void {
        this.apartmentsSignal.update((apts) =>
            apts.map((a) =>
                a.id === apartmentId
                    ? { ...a, expenses: a.expenses.filter((e) => e.id !== expenseId) }
                    : a
            )
        );
        this.saveToStorage();
    }

    calculateMetrics(apartment: Apartment): ApartmentMetrics {
        const takenRooms = apartment.rooms.filter((r) => r.isTaken);

        const monthlyRevenue = takenRooms.reduce(
            (sum, r) => sum + (r.rentMin + r.rentMax) / 2,
            0
        );

        const minMonthlyRevenue = takenRooms.reduce((sum, r) => sum + r.rentMin, 0);
        const maxMonthlyRevenue = takenRooms.reduce((sum, r) => sum + r.rentMax, 0);

        const monthlyCosts = apartment.expenses.reduce((sum, e) => {
            return sum + (e.cadence === 'monthly' ? e.amount : e.amount / 12);
        }, 0);

        const yearlyRevenue = monthlyRevenue * 12;
        const yearlyCosts = monthlyCosts * 12;
        const monthlyProfit = monthlyRevenue - monthlyCosts;
        const yearlyProfit = yearlyRevenue - yearlyCosts;

        const minYearlyRevenue = minMonthlyRevenue * 12;
        const maxYearlyRevenue = maxMonthlyRevenue * 12;
        const minMonthlyProfit = minMonthlyRevenue - monthlyCosts;
        const maxMonthlyProfit = maxMonthlyRevenue - monthlyCosts;
        const minYearlyProfit = minYearlyRevenue - yearlyCosts;
        const maxYearlyProfit = maxYearlyRevenue - yearlyCosts;

        return {
            monthlyRevenue,
            yearlyRevenue,
            monthlyCosts,
            yearlyCosts,
            monthlyProfit,
            yearlyProfit,
            minMonthlyRevenue,
            maxMonthlyRevenue,
            minYearlyRevenue,
            maxYearlyRevenue,
            minMonthlyProfit,
            maxMonthlyProfit,
            minYearlyProfit,
            maxYearlyProfit,
        };
    }

    exportData(): string {
        return JSON.stringify(this.apartmentsSignal(), null, 2);
    }

    importData(data: Apartment[]): void {
        this.apartmentsSignal.set(data);
        this.saveToStorage();
    }

    addTenant(apartmentId: string, tenant: Omit<Tenant, 'id'>): void {
        const newTenant: Tenant = { ...tenant, id: this.generateId() };
        this.apartmentsSignal.update((apts) =>
            apts.map((a) =>
                a.id === apartmentId
                    ? { ...a, tenants: [...a.tenants, newTenant] }
                    : a
            )
        );
        this.saveToStorage();
    }

    updateTenant(apartmentId: string, tenantId: string, updates: Partial<Omit<Tenant, 'id'>>): void {
        this.apartmentsSignal.update((apts) =>
            apts.map((a) =>
                a.id === apartmentId
                    ? {
                        ...a,
                        tenants: a.tenants.map((t) =>
                            t.id === tenantId ? { ...t, ...updates } : t
                        ),
                    }
                    : a
            )
        );
        this.saveToStorage();
    }

    removeTenant(apartmentId: string, tenantId: string): void {
        this.apartmentsSignal.update((apts) =>
            apts.map((a) =>
                a.id === apartmentId
                    ? { ...a, tenants: a.tenants.filter((t) => t.id !== tenantId) }
                    : a
            )
        );
        this.saveToStorage();
    }
}

