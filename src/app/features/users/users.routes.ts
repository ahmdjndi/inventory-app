import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/admin-list/admin-list').then((m) => m.AdminList),
  },
];