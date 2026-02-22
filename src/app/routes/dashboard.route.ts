import { Routes } from '@angular/router';
import { DashboardComponent } from '../components/dashboard/dashboard.component';
import { ExpensesComponent } from '../components/expenses/expenses.component';
import { PaymentsComponent } from '../components/payments/payments.component';
import { RoomsComponent } from '../components/rooms/rooms.component';
import { TenantsComponent } from '../components/tenants/tenants.component';
import { BillCalculatorComponent } from '../components/bill-calculator/bill-calculator.component';
import { OAuthRedirectComponent } from '../components/oauth-redirect/oauth-redirect.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'oauth-redirect',
    component: OAuthRedirectComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'expenses',
    component: ExpensesComponent,
  },
  {
    path: 'payments',
    component: PaymentsComponent,
  },
  {
    path: 'rooms',
    component: RoomsComponent,
  },
  {
    path: 'tenants',
    component: TenantsComponent,
  },
  {
    path: 'bill-calculator',
    component: BillCalculatorComponent,
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
