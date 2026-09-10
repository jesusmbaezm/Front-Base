/**
 * Centralized permission strings used across the app.
 *
 * Usage in a component:
 *   protected readonly Permissions = PERMISSIONS;
 *
 * Usage in a template:
 *   <button *appHasPermission="Permissions.customers.create">...</button>
 *
 * Usage in TS:
 *   this.authState.hasPermission(PERMISSIONS.customers.update)
 */
export const PERMISSIONS = {
  parameters: {
    read: 'parameters.read',
    update: 'parameters.update',
  },
  users: {
    read: 'users.read',
    create: 'users.create',
    update: 'users.update',
    delete: 'users.delete',
    resetPassword: 'users.resetpassword',
  },
  roles: {
    read: 'roles.read',
    create: 'roles.create',
    update: 'roles.update',
    delete: 'roles.delete',
  },
  paymentPlans: {
    read: 'paymentplans.read',
    create: 'paymentplans.create',
    update: 'paymentplans.update',
    delete: 'paymentplans.delete',
    select: 'paymentplans.select',
  },
  customers: {
    read: 'customers.read',
    create: 'customers.create',
    update: 'customers.update',
    delete: 'customers.delete',
    select: 'customers.select',
  },
  suppliers: {
    read: 'suppliers.read',
    create: 'suppliers.create',
    update: 'suppliers.update',
    delete: 'suppliers.delete',
  },
  branches: {
    read: 'branches.read',
    create: 'branches.create',
    update: 'branches.update',
    delete: 'branches.delete',
    select: 'branches.select',
    destinations: 'branches.destinations',
  },
  categories: {
    read: 'categories.read',
    create: 'categories.create',
    update: 'categories.update',
    delete: 'categories.delete',
    select: 'categories.select',
  },
  products: {
    read: 'products.read',
    create: 'products.create',
    update: 'products.update',
    delete: 'products.delete',
    select: 'products.select',
  },
  productPrices: {
    read: 'productprices.read',
    create: 'productprices.create',
    update: 'productprices.update',
    delete: 'productprices.delete',
  },
  productPurchasePrices: {
    read: 'product.purchaseprices.read',
  },
  productStocks: {
    read: 'productstocks.read',
    create: 'productstocks.create',
    update: 'productstocks.update',
    delete: 'productstocks.delete',
  },
  documents: {
    read: 'documents.read',
    create: 'documents.create',
    delete: 'documents.delete',
  },
  taxRegimes: {
    read: 'taxregimes.read',
  },
  inventory: {
    read: 'inventory.read',
    balance: {
      read: 'inventory.balance.read',
      groupedRead: 'inventory.balance.grouped.read',
      lookup: 'inventory.balance.lookup',
      export: 'inventory.balance.export',
    },
    movement: {
      read: 'inventory.movement.read',
      export: 'inventory.movement.export',
    },
    entry: {
      read: 'inventory.entry.read',
      create: 'inventory.entry.create',
      authorize: 'inventory.entry.authorize',
    },
    adjustment: {
      read: 'inventory.adjustment.read',
      create: 'inventory.adjustment.create',
      authorize: 'inventory.adjustment.authorize',
    },
  },
  discounts: {
    read: 'discounts.read',
    create: 'discounts.create',
    update: 'discounts.update',
    delete: 'discounts.delete',
  },
  quotations: {
    read: 'quotations.read',
    create: 'quotations.create',
    update: 'quotations.update',
    viewAll: 'quotations.viewall',
  },
  saleAuthorizations: {
    approve: 'saleauthorizations.approve',
  },
  remissions: {
    read: 'remissions.read',
    create: 'remissions.create',
    cancel: 'remissions.cancel',
    viewAll: 'remissions.viewall',
    withoutCommission: 'remissions.withoutcommission',
  },
  customerReturns: {
    read: 'customerreturns.read',
    create: 'customerreturns.create',
    update: 'customerreturns.update',
    delete: 'customerreturns.delete',
    approve: 'customerreturns.approve',
  },
  periods: {
    read: 'periods.read',
    open: 'periods.open',
    close: 'periods.close',
    reconcile: 'periods.reconcile',
    authorizeReconciliation: 'periods.authorize',
    select: 'periods.select',
  },
  expenseCategories: {
    read: 'expensecategories.read',
    create: 'expensecategories.create',
    update: 'expensecategories.update',
    delete: 'expensecategories.delete',
    select: 'expensecategories.select',
  },
  expenses: {
    read: 'expenses.read',
    create: 'expenses.create',
    update: 'expenses.update',
    delete: 'expenses.delete',
    approve: 'expenses.approve',
  },
  accountsReceivablePayments: {
    read: 'accountsreceivablepayments.read',
    create: 'accountsreceivablepayments.create',
    cancel: 'accountsreceivablepayments.cancel',
  },
  earlyPaymentAuthorizations: {
    read: 'earlypaymentauthorizations.read',
    create: 'earlypaymentauthorizations.create',
    resolve: 'earlypaymentauthorizations.resolve',
  },
  commissions: {
    read: 'commissions.read',
  },
  commissionConfigs: {
    read: 'commissionconfigs.read',
    create: 'commissionconfigs.create',
    update: 'commissionconfigs.update',
    delete: 'commissionconfigs.delete',
  },
  commissionPayouts: {
    create: 'commissionpayouts.create',
  },
  supply: {
    backorder: {
      read: 'supply.backorder.read',
      create: 'supply.backorder.create',
      update: 'supply.backorder.update',
      delete: 'supply.backorder.delete',
    },
    consolidatedBackorder: {
      read: 'supply.consolidatedbackorder.read',
      export: 'supply.consolidatedbackorder.export',
    },
    shipment: {
      read: 'supply.shipment.read',
      create: 'supply.shipment.create',
      update: 'supply.shipment.update',
      delete: 'supply.shipment.delete',
    },
    reception: {
      read: 'supply.reception.read',
      confirm: 'supply.reception.confirm',
    },
    movement: { read: 'supply.movement.read' },
  },
  transfer: {
    read: 'transfer.read',
    create: 'transfer.create',
    update: 'transfer.update',
    delete: 'transfer.delete',
    reception: {
      read: 'transfer.reception.read',
      confirm: 'transfer.reception.confirm',
    },
  },
  reports: {
    dashboard: 'reports.dashboard',
    finances: 'reports.finances',
    productsDashboard: 'reports.products.dashboard',
    accountsReceivable: 'reports.accounts-receivable',
    reconciliations: 'reports.reconciliations',
    sales: 'reports.sales',
    commissions: 'reports.commissions',
    collections: 'reports.collections',
    stateOfAccount: 'reports.stat-of-account',
  },
  bankAccounts: {
    read: 'bankaccounts.read',
    create: 'bankaccounts.create',
    update: 'bankaccounts.update',
    delete: 'bankaccounts.delete',
    select: 'bankaccounts.select',
  },
} as const;

export type Permissions = typeof PERMISSIONS;
