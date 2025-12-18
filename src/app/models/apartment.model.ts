export interface Room {
  id: string;
  name: string;
  rentMin: number;
  rentMax: number;
  isTaken: boolean;
}

export type ExpenseCadence = 'monthly' | 'yearly';

export interface Expense {
  id: string;
  name: string;
  amount: number;
  cadence: ExpenseCadence;
}

export interface Apartment {
  id: string;
  name: string;
  rooms: Room[];
  expenses: Expense[];
}

export interface ApartmentMetrics {
  monthlyRevenue: number;
  yearlyRevenue: number;
  monthlyCosts: number;
  yearlyCosts: number;
  monthlyProfit: number;
  yearlyProfit: number;
  minMonthlyRevenue: number;
  maxMonthlyRevenue: number;
}

