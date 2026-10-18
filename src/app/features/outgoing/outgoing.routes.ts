import { Routes } from '@angular/router';

export const OUTGOING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/outgoing-list/outgoing-list').then((m) => m.OutgoingList),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/outgoing-create/outgoing-create').then(
        (m) => m.OutgoingCreate
      ),
  },
];