import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const appRoutes: Routes = [
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/presentation/pages/login-page/login-page').then(
        (m) => m.LoginPageComponent,
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/shell/shell-layout.component').then((m) => m.ShellLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/presentation/pages/dashboard-page/dashboard-page').then(
            (m) => m.DashboardPage,
          ),
        data: {
          permission: 'dashboard.view',
        },
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('./features/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
      },
    ],
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/pages/unauthorized-page').then((m) => m.UnauthorizedPage),
  },
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];
