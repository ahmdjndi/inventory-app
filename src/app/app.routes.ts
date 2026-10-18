import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard'

const comingSoon = () =>
  import('./shared/components/coming-soon/coming-soon').then(
    (m) => m.ComingSoon
  );

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout').then(
        (m) => m.PublicLayout
      ),
    loadChildren: () =>
      import('./features/catalog/catalog.routes').then((m) => m.CATALOG_ROUTES),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/auth-layout/auth-layout').then((m) => m.AuthLayout),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/login/login').then((m) => m.Login),
      },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout').then((m) => m.MainLayout),
    canActivate: [authGuard],
    children: [
      {
  path: 'dashboard',
  canActivate: [roleGuard(['admin'])], // ← baru
  loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard').then((m) => m.Dashboard),
},
{
  path: 'items',
  canActivate: [roleGuard(['admin'])], // ← baru
  loadChildren: () => import('./features/items/items.routes').then((m) => m.ITEMS_ROUTES),
},
{
  path: 'categories',
  canActivate: [roleGuard(['admin'])], // ← baru
  loadChildren: () => import('./features/categories/categories.routes').then((m) => m.CATEGORIES_ROUTES),
},
{
  path: 'locations',
  canActivate: [roleGuard(['admin'])], // ← baru
  loadChildren: () => import('./features/locations/locations.routes').then((m) => m.LOCATIONS_ROUTES),
},
{
  path: 'incoming',
  canActivate: [roleGuard(['admin'])], // ← baru
  loadChildren: () => import('./features/incoming/incoming.routes').then((m) => m.INCOMING_ROUTES),
},
{
  path: 'outgoing',
  canActivate: [roleGuard(['admin'])], // ← baru
  loadChildren: () => import('./features/outgoing/outgoing.routes').then((m) => m.OUTGOING_ROUTES),
},
{
  path: 'loans',
  // Tidak diberi roleGuard — Admin & Petugas sama-sama boleh akses.
  loadChildren: () => import('./features/loans/loans.routes').then((m) => m.LOANS_ROUTES),
},
{
  path: 'transactions',
  loadChildren: () => import('./features/transactions/transactions.routes').then((m) => m.TRANSACTIONS_ROUTES),
},
{
  path: 'users',
  canActivate: [roleGuard(['admin'])], // ← baru
  loadChildren: () => import('./features/users/users.routes').then((m) => m.USERS_ROUTES),
},
    ],
  },
  { path: '**', redirectTo: '' }, // ← diubah, sebelumnya 'login'
];