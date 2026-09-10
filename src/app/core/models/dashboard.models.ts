export interface DashboardRecentActivityItem {
  occurredAt: string;
  sourceType: string;
  sourceId: number;
  title: string;
  description: string;
  branchId: number;
  branchName: string;
}

export interface DashboardRecentActivityResponse {
  message: string;
  data: {
    items: DashboardRecentActivityItem[];
  };
  errors: string[];
}

export interface DashboardSummary {
  salesOfDayAmount: number;
  pendingCollectionsAmount: number;
  inTransitShipmentsCount: number;
  pendingCashDifferencesCount: number;
}

export interface DashboardQuickIndicators {
  overdueCustomersCount: number;
  criticalInventorySkuCount: number;
  pendingExpensesCount: number;
  openAuthorizations: {
    total: number;
    sales: number;
    earlyPayments: number;
  };
}

export interface DashboardOverviewData {
  summary: DashboardSummary;
  quickIndicators: DashboardQuickIndicators;
}

export interface DashboardOverviewResponse {
  message: string;
  data: DashboardOverviewData;
  errors: string[];
}
