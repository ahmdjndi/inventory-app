import { Routes } from '@angular/router';

export const LOCATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/location-list/location-list').then((m) => m.LocationList),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/location-create/location-create').then(
        (m) => m.LocationCreate
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/location-edit/location-edit').then((m) => m.LocationEdit),
  },
];