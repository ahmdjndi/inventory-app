import { Routes } from '@angular/router';

export const CATALOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'katalog',
    loadComponent: () =>
      import('./pages/catalog-list/catalog-list').then((m) => m.CatalogList),
  },
  {
    path: 'katalog/:id',
    loadComponent: () =>
      import('./pages/catalog-detail/catalog-detail').then(
        (m) => m.CatalogDetail
      ),
  },
  {
    path: 'pinjam',
    loadComponent: () =>
      import('./pages/loan-cart/loan-cart').then((m) => m.LoanCart),
  },
  {
    path: 'tentang-kami',
    loadComponent: () => import('./pages/about/about').then((m) => m.About),
  },
  {
  path: 'cek-status',
  loadComponent: () =>
    import('./pages/check-status/check-status/check-status').then((m) => m.CheckStatus),
},
];