import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Apartment, Room, Expense, ApartmentMetrics, ExpenseCadence, Tenant, Payment } from '../models/apartment.model';
import { CloudSyncService } from './cloud-sync.service';
import { GoogleDriveService, GDRIVE_CONFIG_LOADED_EVENT } from './google-drive.service';
import { getActiveTenantsForRoom, isTenantContractActive } from '../utils/tenant-occupancy.util';
import { generateUUID } from '../utils/uuid.util';

const STORAGE_KEY = 'apartment-manager-data';
const CURRENT_APARTMENT_KEY = 'current-apartment-id';

@Injectable({ providedIn: 'root' })
export class ApartmentService {
    private cloudSync = inject(CloudSyncService);
    private googleDrive = inject(GoogleDriveService);

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

        window.addEventListener(GDRIVE_CONFIG_LOADED_EVENT, ((event: CustomEvent<string>) => {
            const json = event.detail;
            if (!json) return;
            try {
                const data = JSON.parse(json) as Apartment[];
                if (Array.isArray(data) && data.length >= 0) {
                    this.isSyncingToCloud = true;
                    const normalized = data.map((apt) => ({
                        ...apt,
                        tenants: apt.tenants || [],
                        payments: apt.payments || [],
                    }));
                    this.apartmentsSignal.set(normalized);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
                    const currentId = this.currentApartmentIdSignal();
                    if (currentId) this.setCurrentApartment(currentId);
                    setTimeout(() => {
                        this.isSyncingToCloud = false;
                    }, 100);
                }
            } catch {
                //
            }
        }) as EventListener);

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
            payments: apt.payments || [],
        }));
    }

    private loadCurrentApartmentId(): string | null {
        return localStorage.getItem(CURRENT_APARTMENT_KEY);
    }

    private saveToStorage(): void {
        const data = JSON.stringify(this.apartmentsSignal());
        localStorage.setItem(STORAGE_KEY, data);
        if (this.googleDrive.connected()) {
            this.googleDrive.saveToDrive(this.exportData());
        }
    }

    private saveCurrentApartmentId(id: string | null): void {
        if (id) {
            localStorage.setItem(CURRENT_APARTMENT_KEY, id);
        } else {
            localStorage.removeItem(CURRENT_APARTMENT_KEY);
        }
    }

    private generateId(): string {
        return generateUUID();
    }

    private parseYmdDate(value?: string): Date | null {
        if (!value) return null;
        const parts = value.split('-').map(Number);
        if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
            return null;
        }
        const [year, month, day] = parts;
        return new Date(year, month - 1, day);
    }

    private sanitizeDisabledDates(tenant: Pick<Tenant, 'startDate' | 'endDate' | 'disabledDates'>): string[] | undefined {
        const disabledDates = tenant.disabledDates || [];
        if (disabledDates.length === 0) return undefined;

        const startTime = this.parseYmdDate(tenant.startDate)?.getTime();
        const endTime = this.parseYmdDate(tenant.endDate)?.getTime();
        const filtered = disabledDates.filter((dateValue) => {
            const time = this.parseYmdDate(dateValue)?.getTime();
            if (time === undefined) return false;
            if (startTime !== undefined && time < startTime) return false;
            if (endTime !== undefined && time > endTime) return false;
            return true;
        });
        const unique = Array.from(new Set(filtered));
        return unique.length > 0 ? unique : undefined;
    }

    private withSanitizedDisabledDates(tenant: Tenant): Tenant {
        const disabledDates = this.sanitizeDisabledDates(tenant);
        return {
            ...tenant,
            disabledDates,
        };
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
            payments: [],
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
        const takenRoomIds = new Set(
            apartment.rooms
                .filter((room) => getActiveTenantsForRoom(apartment.tenants, room.id).length > 0)
                .map((room) => room.id)
        );
        const takenRooms = apartment.rooms.filter((room) => takenRoomIds.has(room.id));

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
        const newTenant = this.withSanitizedDisabledDates({ ...tenant, id: this.generateId() });
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
                            t.id === tenantId ? this.withSanitizedDisabledDates({ ...t, ...updates }) : t
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

    toggleTenantOccupancyDate(apartmentId: string, tenantId: string, date: string, disabled: boolean): void {
        this.apartmentsSignal.update((apts) =>
            apts.map((a) =>
                a.id === apartmentId
                    ? {
                        ...a,
                        tenants: a.tenants.map((t) => {
                            if (t.id !== tenantId) return t;
                            
                            const disabledDates = t.disabledDates || [];
                            let updatedDisabledDates: string[];
                            
                            if (disabled) {
                                updatedDisabledDates = disabledDates.includes(date)
                                    ? disabledDates
                                    : [...disabledDates, date];
                            } else {
                                updatedDisabledDates = disabledDates.filter((d) => d !== date);
                            }

                            return this.withSanitizedDisabledDates({
                                ...t,
                                disabledDates: updatedDisabledDates,
                            });
                        }),
                    }
                    : a
            )
        );
        this.saveToStorage();
    }

    generateRentPayments(apartmentId: string, month: number, year: number): void {
        const apartment = this.apartmentsSignal().find((a) => a.id === apartmentId);
        if (!apartment) return;

        const lastDay = new Date(year, month + 1, 0).getDate();
        const referenceDate = new Date(year, month, 15);
        const allPayments = apartment.payments || [];

        const seenRentRooms = new Set<string>();
        const deduped = allPayments.filter((p) => {
            if (p.type === 'rent' && p.month === month && p.year === year) {
                const key = p.roomId;
                if (seenRentRooms.has(key)) return false;
                seenRentRooms.add(key);
            }
            return true;
        });
        if (deduped.length < allPayments.length) {
            this.apartmentsSignal.update((apts) =>
                apts.map((a) => a.id === apartmentId ? { ...a, payments: deduped } : a)
            );
            this.saveToStorage();
        }

        const existing = deduped;
        const newPayments: Payment[] = [];


        for (const room of apartment.rooms) {
            const roomAlreadyHasRent = existing.some(
                (p) => p.roomId === room.id && p.month === month && p.year === year && p.type === 'rent'
            );
            if (roomAlreadyHasRent) continue;

            const activeTenant = apartment.tenants.find(
                (t) => t.roomId === room.id && t.rentCollectionDay && isTenantContractActive(t, referenceDate)
            );
            if (!activeTenant) continue;

            const day = Math.min(activeTenant.rentCollectionDay!, lastDay);
            const dueDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            newPayments.push({
                id: this.generateId(),
                type: 'rent',
                roomId: room.id,
                tenantId: activeTenant.id,
                amount: (room.rentMin + room.rentMax) / 2,
                dueDate,
                month,
                year,
            });
        }

        if (newPayments.length === 0) return;

        this.apartmentsSignal.update((apts) =>
            apts.map((a) =>
                a.id === apartmentId
                    ? { ...a, payments: [...(a.payments || []), ...newPayments] }
                    : a
            )
        );
        this.saveToStorage();
    }

    togglePaymentPaid(apartmentId: string, paymentId: string): void {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        this.apartmentsSignal.update((apts) =>
            apts.map((a) =>
                a.id === apartmentId
                    ? {
                        ...a,
                        payments: (a.payments || []).map((p) =>
                            p.id === paymentId
                                ? { ...p, paidDate: p.paidDate ? undefined : todayStr }
                                : p
                        ),
                    }
                    : a
            )
        );
        this.saveToStorage();
    }

    removePayment(apartmentId: string, paymentId: string): void {
        this.apartmentsSignal.update((apts) =>
            apts.map((a) =>
                a.id === apartmentId
                    ? { ...a, payments: (a.payments || []).filter((p) => p.id !== paymentId) }
                    : a
            )
        );
        this.saveToStorage();
    }

    addBillPayments(apartmentId: string, bills: Array<{ tenantId: string; amount: number }>, month: number, year: number): void {
        const apartment = this.apartmentsSignal().find((a) => a.id === apartmentId);
        if (!apartment) return;

        const lastDay = new Date(year, month + 1, 0).getDate();
        const newPayments: Payment[] = [];

        for (const bill of bills) {
            const tenant = apartment.tenants.find((t) => t.id === bill.tenantId);
            if (!tenant) continue;

            const day = Math.min(tenant.rentCollectionDay || 1, lastDay);
            const dueDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            newPayments.push({
                id: this.generateId(),
                type: 'bill',
                roomId: tenant.roomId,
                tenantId: tenant.id,
                amount: bill.amount,
                dueDate,
                month,
                year,
            });
        }

        if (newPayments.length === 0) return;

        this.apartmentsSignal.update((apts) =>
            apts.map((a) =>
                a.id === apartmentId
                    ? { ...a, payments: [...(a.payments || []), ...newPayments] }
                    : a
            )
        );
        this.saveToStorage();
    }

    getPaymentsForMonth(apartmentId: string, month: number, year: number): Payment[] {
        const apartment = this.apartmentsSignal().find((a) => a.id === apartmentId);
        if (!apartment) return [];
        return (apartment.payments || [])
            .filter((p) => p.month === month && p.year === year)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    }
}

