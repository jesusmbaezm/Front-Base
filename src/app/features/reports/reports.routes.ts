import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  {
    path: 'collections',
    loadComponent: () =>
      import('./presentation/pages/collections-report-page/collections-report-page').then(
        (m) => m.CollectionsReportPage,
      ),
    data: {
      permission: 'reports.collections',
    },
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./presentation/pages/products-dashboard-page/products-dashboard-page').then(
        (m) => m.ProductsDashboardPage,
      ),
    data: {
      permission: 'reports.products.dashboard',
    },
  },
  {
    path: 'finances',
    loadComponent: () =>
      import('./presentation/pages/finances-report-page/finances-report-page').then(
        (m) => m.FinancesReportPage,
      ),
    data: {
      permission: 'reports.finances',
    },
  },
];
