import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  CollectionsCustomerReportItem,
  CollectionsReportData,
  CollectionsReportFilter,
  CollectionsScheduleItem,
  CollectionsReportTotals,
} from '@app/core/models/reports.models';
import { ReportsApiService } from '@app/core/security/reports-api.service';
import { BranchSelectComponent } from '@app/shared/components/branch-select/branch-select.component';
import { ButtonComponent } from '@app/shared/components/button/button.component';
import { ToastService } from '@app/shared/services/toast.service';

@Component({
  selector: 'app-collections-report-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    BranchSelectComponent,
    ButtonComponent,
  ],
  templateUrl: './collections-report-page.html',
  styleUrl: './collections-report-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionsReportPage implements OnInit {
  private readonly reportsApi = inject(ReportsApiService);
  private readonly toast = inject(ToastService);

  private readonly emptyTotals: CollectionsReportTotals = {
    totalAmount: 0,
    totalBalance: 0,
    totalPaid: 0,
  };

  readonly selectedBranchId = signal<number | null>(null);
  readonly isLoading = signal(false);
  readonly isExporting = signal(false);
  readonly hasError = signal(false);
  readonly reportData = signal<CollectionsReportData | null>(null);
  readonly expandedCustomers = signal<Set<number>>(new Set());

  readonly totals = computed(() => this.reportData()?.totals ?? this.emptyTotals);
  readonly customerCount = computed(() => this.reportData()?.customers.length ?? 0);
  readonly scheduleCount = computed(
    () =>
      this.reportData()?.customers.reduce((sum, customer) => sum + customer.schedules.length, 0) ?? 0,
  );

  ngOnInit(): void {
    this.loadReport();
  }

  onBranchChange(branchId: number | null): void {
    this.selectedBranchId.set(branchId);
    this.loadReport();
  }

  loadReport(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.reportsApi.getCollectionsReport(this.buildFilter()).subscribe({
      next: (response) => {
        this.reportData.set(response.data);
        this.expandedCustomers.set(
          response.data.customers.length > 0 ? new Set([response.data.customers[0].customerId]) : new Set(),
        );
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[CollectionsReportPage] loadReport()', err);
        this.hasError.set(true);
        this.reportData.set(null);
        this.expandedCustomers.set(new Set());
        this.isLoading.set(false);
      },
    });
  }

  onExportPdf(): void {
    this.isExporting.set(true);

    this.reportsApi.exportCollectionsReportPdf(this.buildFilter()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        this.isExporting.set(false);
      },
      error: (err) => {
        console.error('[CollectionsReportPage] onExportPdf()', err);
        this.toast.error('No fue posible exportar el PDF del reporte.', 'Error');
        this.isExporting.set(false);
      },
    });
  }

  toggleCustomer(customerId: number): void {
    const expanded = new Set(this.expandedCustomers());
    if (expanded.has(customerId)) {
      expanded.delete(customerId);
    } else {
      expanded.add(customerId);
    }

    this.expandedCustomers.set(expanded);
  }

  isCustomerExpanded(customerId: number): boolean {
    return this.expandedCustomers().has(customerId);
  }

  trackCustomer(_: number, customer: CollectionsCustomerReportItem): number {
    return customer.customerId;
  }

  trackSchedule(_: number, schedule: CollectionsScheduleItem): number {
    return schedule.paymentScheduleId;
  }

  getOverdueVariant(overdueDays: number): string {
    if (overdueDays > 30) return 'is-critical';
    if (overdueDays > 0) return 'is-warning';
    return 'is-current';
  }

  formatRemissionDate(value: string): string {
    return new Date(value).toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDueDate(value: string): string {
    return new Date(value).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private buildFilter(): CollectionsReportFilter {
    const filter: CollectionsReportFilter = {};

    if (this.selectedBranchId() != null) {
      filter.branchId = this.selectedBranchId();
    }

    return filter;
  }
}
