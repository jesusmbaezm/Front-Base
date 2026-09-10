import { Routes } from '@angular/router';
import { permissionGuard } from '@app/core/guards/permission.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'users',
    pathMatch: 'full'
  },
  {
    path: 'branches',
    canActivate: [permissionGuard],
    loadComponent: () =>
      import('./presentation/pages/branches-page/branches-page')
        .then(m => m.BranchesPage),
    data: {
      permission: 'branches.read'
    }
  },
  {
    path: 'users',
    canActivate: [permissionGuard],
    loadComponent: () =>
      import('./presentation/pages/users-page/users-page')
        .then(m => m.UsersPage),
    data: {
      permission: 'users.read'
    }
  },
  {
    path: 'roles',
    canActivate: [permissionGuard],
    loadComponent: () =>
      import('./presentation/pages/roles-page/roles-page')
        .then(m => m.RolesPage),
    data: {
      permission: 'roles.read'
    }
  },
  {
    path: 'parameters',
    loadComponent: () =>
      import('./presentation/pages/parametros-page/parametros-page')
        .then(m => m.ParametrosPage),
    data: {
      permission: 'parameters.read'
    }
  },
  {
    path: 'suppliers',
    loadComponent: () =>
      import('./presentation/pages/suppliers-page/suppliers-page')
        .then(m => m.SuppliersPage),
    data: {
      permission: 'suppliers.read'
    }
  },
  {
    path: 'suppliers/:id',
    loadComponent: () =>
      import('./presentation/pages/supplier-detail-page/supplier-detail-page')
        .then(m => m.SupplierDetailPage),
    data: {
      permission: 'suppliers.read'
    }
  },
  {
    path: 'clients',
    loadComponent: () =>
      import('./presentation/pages/clients-page/clients-page')
        .then(m => m.ClientsPage),
    data: {
      permission: 'customers.read'
    }
  },
  {
    path: 'clients/:id',
    loadComponent: () =>
      import('./presentation/pages/client-detail-page/client-detail-page')
        .then(m => m.ClientDetailPage),
    data: {
      permission: 'customers.read'
    }
  },
  {
    path: 'expense-categories',
    canActivate: [permissionGuard],
    loadComponent: () =>
      import('./presentation/pages/expense-categories-page/expense-categories-page')
        .then(m => m.ExpenseCategoriesPage),
    data: {
      permission: 'expensecategories.read'
    }
  },
  {
    path: 'expense-categories/:id',
    canActivate: [permissionGuard],
    loadComponent: () =>
      import('./presentation/pages/expense-category-detail-page/expense-category-detail-page')
        .then(m => m.ExpenseCategoryDetailPage),
    data: {
      permission: 'expensecategories.read'
    }
  },
  {
    path: 'commission-configs',
    canActivate: [permissionGuard],
    loadComponent: () =>
      import('./presentation/pages/commission-configs-page/commission-configs-page')
        .then(m => m.CommissionConfigsPage),
    data: {
      permission: 'commissionconfigs.read'
    }
  },
  {
    path: 'bank-accounts',
    canActivate: [permissionGuard],
    loadComponent: () =>
      import('./presentation/pages/bank-accounts-page/bank-accounts-page')
        .then(m => m.BankAccountsPage),
    data: {
      permission: 'bankaccounts.read'
    }
  },
  {
    path: 'payment-plans',
    canActivate: [permissionGuard],
    loadComponent: () =>
      import('./presentation/pages/payment-plans-page/payment-plans-page')
        .then(m => m.PaymentPlansPage),
    data: {
      permission: 'paymentplans.read'
    }
  }
];
