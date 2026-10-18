import { Routes } from '@angular/router';

export const CATEGORIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/category-list/category-list').then((m) => m.CategoryList),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/category-create/category-create').then(
        (m) => m.CategoryCreate
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/category-edit/category-edit').then((m) => m.CategoryEdit),
  },
];