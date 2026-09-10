import { Routes } from '@angular/router';

export const BACKORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/pages/backorders-branch-pages/backorders-branch-pages').then((m) => m.BackordersBranchPages),
    data: {
      permission: 'supply.backorder.read',
    },
  },
  {
    path: 'consolidated',
    loadComponent: () =>
      import('./presentation/pages/backorders-consolidated-pages/backorders-consolidated-pages').then((m) => m.BackordersConsolidatedPages),
    data: {
      permission: 'supply.consolidatedbackorder.read',
    },
  },
  {
    path: 'shipment',
    loadComponent: () =>
      import('./presentation/pages/backorders-shipments-pages/backorders-shipments-pages').then((m) => m.BackordersShipmentsPages),
    data: {
      permission: 'supply.shipment.read',
    },
  },
  {
    path: 'shipment/detail/consult/:shipmentId',
    loadComponent: () =>
      import('./presentation/pages/backorders-shipments-pages/componentes/backorders-shipments-consult-details-page/backorders-shipments-consult-details-page').then((m) => m.BackordersShipmentsConsultDetailsPage),
    data: {
      permission: 'supply.shipment.read',
    },
  },
  {
    path: 'shipment/detail/:modo/:shipmentId',
    loadComponent: () =>
      import('./presentation/pages/backorders-shipment-detail-pages/backorders-shipments-detail-page').then(
        (m) => m.BackordersShipmentsFormDialog,
      ),
    data: {
      permission: 'supply.shipment.update',
    },
  },
  {
    path: 'shipment/detail/line/:modo/:shipmentId/:branchId',
    loadComponent: () =>
      import('./presentation/pages/backorders-shipments-lines-pages/backorders-shipments-lines-pages').then(
        (m) => m.BackordersShipmentsLinesPages,
      ),
    data: {
      permission: 'supply.shipment.update',
    },
  },
  {
    path: 'receptions',
    loadComponent: () =>
      import('./presentation/pages/backorders-receptions-pages/backorders-receptions-pages').then((m) => m.BackordersReceptionsPages),
    data: {
      permission: 'supply.reception.read',
    },
  },
  {
    path: 'receptions/detail/:modo/:receptionId',
    loadComponent: () =>
      import('./presentation/pages/backorders-receptions-pages/component/backorders-receptions-details-page/backorders-receptions-details-page').then((m) => m.BackordersReceptionsDetailsPage),
    data: {
      permission: 'supply.reception.read',
    },
  },
];
