import { Routes } from '@angular/router';
import { DashboardComponent } from '../components/dashboard/dashboard.component';
import { ExpensesComponent } from '../components/expenses/expenses.component';
import { RoomsComponent } from '../components/rooms/rooms.component';
import { TenantsComponent } from '../components/tenants/tenants.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
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
    path: 'rooms',
    component: RoomsComponent,
  },
  {
    path: 'tenants',
    component: TenantsComponent,
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
