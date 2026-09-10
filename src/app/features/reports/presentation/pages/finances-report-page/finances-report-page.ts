import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ReportsApiService } from '@app/core/security/reports-api.service';
import { AuthStateService } from '@app/core/session/auth-state.service';
import { SimpleBranch } from '@app/core/session/auth-state.service';
import { FinancesReportInner, FinancesReportFilter } from '@app/core/models/reports.models';
import { PeriodsApiService } from '@app/core/security/periods-api.service';
import { PeriodSelect } from '@app/core/models/period.model';

@Component({
  selector: 'app-finances-report-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatTooltipModule,
  ],
  templateUrl: './finances-report-page.html',
  styleUrl: './finances-report-page.scss',
})
export class FinancesReportPage implements OnInit {
  private readonly reportsApi = inject(ReportsApiService);
  private readonly authState = inject(AuthStateService);
  private readonly periodsApi = inject(PeriodsApiService);

  readonly branches = signal<SimpleBranch[]>([]);
  readonly periods = signal<PeriodSelect[]>([]);
  readonly selectedBranchId = signal<number | null>(null);
  readonly selectedPeriodId = signal<number | null>(null);
  readonly fromDate = signal<Date | null>(null);
  readonly toDate = signal<Date | null>(null);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly reportData = signal<FinancesReportInner | null>(null);

  readonly activeTab = signal('efectivo');

  // ── Paginación cliente (10 por página por tab) ──
  readonly pageSize = 10;
  readonly cashPage = signal(1);
  readonly creditPage = signal(1);
  readonly paymentsPage = signal(1);
  readonly expensesPage = signal(1);

  private paginate<T>(items: T[], page: number): T[] {
    const start = (page - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }

  readonly cashSalesPaged = computed(() =>
    this.paginate(this.reportData()?.cashSales ?? [], this.cashPage())
  );
  readonly creditSalesPaged = computed(() =>
    this.paginate(this.reportData()?.creditSales ?? [], this.creditPage())
  );
  readonly paymentsPaged = computed(() =>
    this.paginate(this.reportData()?.payments ?? [], this.paymentsPage())
  );
  readonly expensesPaged = computed(() =>
    this.paginate(this.expensesWithPercentage(), this.expensesPage())
  );

  totalPages(count: number): number {
    return Math.max(1, Math.ceil(count / this.pageSize));
  }

  goPage(target: 'cash' | 'credit' | 'payments' | 'expenses', delta: number, total: number): void {
    const max = this.totalPages(total);
    const sig =
      target === 'cash' ? this.cashPage
      : target === 'credit' ? this.creditPage
      : target === 'payments' ? this.paymentsPage
      : this.expensesPage;
    sig.set(Math.min(max, Math.max(1, sig() + delta)));
  }

  private resetPages(): void {
    this.cashPage.set(1);
    this.creditPage.set(1);
    this.paymentsPage.set(1);
    this.expensesPage.set(1);
  }

  readonly expensesWithPercentage = computed(() => {
    const data = this.reportData();
    if (!data?.expensesByCategory?.length) return [];
    const max = Math.max(...data.expensesByCategory.map(g => g.total));
    return data.expensesByCategory.map(g => ({
      ...g,
      percentage: max > 0 ? (g.total / max) * 100 : 0,
    }));
  });

  readonly marginPercent = computed(() => {
    const data = this.reportData();
    if (!data || data.totalIncome === 0) return '0.0';
    return ((data.margin / data.totalIncome) * 100).toFixed(1);
  });

  readonly totalExpenseCount = computed(() => {
    const data = this.reportData();
    if (!data?.expensesByCategory?.length) return 0;
    return data.expensesByCategory.reduce((sum, e) => sum + e.count, 0);
  });


  ngOnInit(): void {
    this.loadUserBranches();
  }

  loadUserBranches(): void {
    const user = this.authState.user();
    if (user?.branches) {
      this.branches.set(user.branches);
      if (user.branches.length >= 1) {
        this.selectedBranchId.set(user.branches[0].id);
        this.loadPeriodsByBranch();
        this.loadReport();
      }
    }
  }

  loadPeriodsByBranch(): void {
    this.periodsApi.getPeriodsSelect(this.selectedBranchId()).subscribe({
      next: (response) => this.periods.set(response.data),
      error: (err) => console.error('[FinancesReportPage] loadPeriodsByBranch()', err),
    });
  }

  loadReport(): void {
    const branchId = this.selectedBranchId();
    if (!branchId) return;

    this.isLoading.set(true);
    this.hasError.set(false);

    const filter: FinancesReportFilter = {
      branchId,
      periodId: this.selectedPeriodId(),
    };

    this.reportsApi.getFinancesReport(filter).subscribe({
      next: (response) => {
        if (response.data) {
          this.reportData.set(response.data);
          this.resetPages();
        } else {
          this.hasError.set(true);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[FinancesReportPage] loadReport()', err);
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  setTab(tab: string): void {
    this.activeTab.set(tab);
  }

  onPeriodChange(value: number): void {
    // 0 is the sentinel for "Todos" → treat as null for the API
    this.selectedPeriodId.set(value === 0 ? null : value);
    this.loadReport();
  }

  onBranchChange(branchId: number): void {
    this.selectedBranchId.set(branchId);
    this.selectedPeriodId.set(null);
    this.periods.set([]); // clear stale periods from previous branch immediately
    this.loadPeriodsByBranch();
    this.loadReport();
  }

  onSearch(): void {
    this.loadReport();
  }

  onClearFilters(): void {
    this.selectedPeriodId.set(null);
    this.loadReport();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
