import { Injectable, signal, computed } from '@angular/core';
import { Apartment, Room, Expense, ApartmentMetrics, ExpenseCadence } from '../models/apartment.model';

const STORAGE_KEY = 'apartment-manager-data';

@Injectable({ providedIn: 'root' })
export class ApartmentService {
  private readonly apartmentsSignal = signal<Apartment[]>(this.loadFromStorage());

  readonly apartments = this.apartmentsSignal.asReadonly();

  private loadFromStorage(): Apartment[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.apartmentsSignal()));
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  addApartment(name: string): void {
    const apartment: Apartment = {
      id: this.generateId(),
      name,
      rooms: [],
      expenses: [],
    };
    this.apartmentsSignal.update((apts) => [...apts, apartment]);
    this.saveToStorage();
  }

  removeApartment(id: string): void {
    this.apartmentsSignal.update((apts) => apts.filter((a) => a.id !== id));
    this.saveToStorage();
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

    return {
      monthlyRevenue,
      yearlyRevenue,
      monthlyCosts,
      yearlyCosts,
      monthlyProfit,
      yearlyProfit,
      minMonthlyRevenue,
      maxMonthlyRevenue,
    };
  }
}

