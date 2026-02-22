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

export interface Tenant {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    roomId: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
    disabledDates?: string[];
    rentCollectionDay?: number;
}

export type PaymentType = 'rent' | 'bill';

export interface Payment {
    id: string;
    type: PaymentType;
    roomId: string;
    tenantId: string;
    amount: number;
    dueDate: string;
    month: number;
    year: number;
    paidDate?: string;
}

export interface Apartment {
    id: string;
    name: string;
    rooms: Room[];
    expenses: Expense[];
    tenants: Tenant[];
    payments: Payment[];
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
    minYearlyRevenue: number;
    maxYearlyRevenue: number;
    minMonthlyProfit: number;
    maxMonthlyProfit: number;
    minYearlyProfit: number;
    maxYearlyProfit: number;
}

