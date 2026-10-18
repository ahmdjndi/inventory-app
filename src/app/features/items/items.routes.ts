import { Routes } from '@angular/router';

export const ITEMS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/item-list/item-list').then((m) => m.ItemList),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/item-create/item-create').then((m) => m.ItemCreate),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/item-detail/item-detail').then((m) => m.ItemDetail),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/item-edit/item-edit').then((m) => m.ItemEdit),
  },
];