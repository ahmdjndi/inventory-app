import { Routes } from '@angular/router';

export const INCOMING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/incoming-list/incoming-list').then((m) => m.IncomingList),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/incoming-create/incoming-create').then(
        (m) => m.IncomingCreate
      ),
  },
];