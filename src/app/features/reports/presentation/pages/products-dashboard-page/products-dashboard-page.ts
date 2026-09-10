import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ReportsApiService } from '@app/core/security/reports-api.service';
import { AuthStateService } from '@app/core/session/auth-state.service';
import { SimpleBranch } from '@app/core/session/auth-state.service';
import { ProductsDashboardInner } from '@app/core/models/reports.models';

@Component({
  selector: 'app-products-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './products-dashboard-page.html',
  styleUrl: './products-dashboard-page.scss',
})
export class ProductsDashboardPage implements OnInit {
  private readonly reportsApi = inject(ReportsApiService);
  private readonly authState = inject(AuthStateService);

  readonly branches = signal<SimpleBranch[]>([]);
  readonly selectedBranchId = signal<number | null>(null);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly dashboardData = signal<ProductsDashboardInner | null>(null);

  readonly activeTab = signal('mas');

  readonly currentList = computed(() => {
    const data = this.dashboardData();
    if (!data) return [];
    switch (this.activeTab()) {
      case 'mas':       return data.topSold;
      case 'menos':     return data.leastSold;
      case 'sin':       return data.mostDaysWithoutSales as any[];
      case 'devueltos': return data.topReturns;
      default:          return [];
    }
  });

  readonly currentTotal = computed(() =>
    this.currentList().reduce((s: number, p: any) => s + (p.totalQuantity ?? 0), 0)
  );

  readonly maxQuantity = computed(() => {
    const list = this.currentList();
    if (!list.length) return 0;
    return Math.max(...list.map((p: any) => p.totalQuantity ?? 0));
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
        this.loadDashboard();
      }
    }
  }

  loadDashboard(): void {
    const branchId = this.selectedBranchId();
    if (!branchId) return;

    this.isLoading.set(true);
    this.hasError.set(false);

    this.reportsApi.getProductsDashboard(branchId).subscribe({
      next: (response) => {
        if (response.data && response.data.topSold) {
          this.dashboardData.set(response.data);
        } else {
          this.hasError.set(true);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[ProductsDashboardPage] loadDashboard()', err);
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  setTab(tab: string): void {
    this.activeTab.set(tab);
  }

  onBranchChange(branchId: number): void {
    this.selectedBranchId.set(branchId);
    this.loadDashboard();
  }

  getRankClass(index: number): string {
    if (index === 0) return 'rank-1';
    if (index === 1) return 'rank-2';
    if (index === 2) return 'rank-3';
    return 'rank-n';
  }

  getBarWidth(quantity: number): number {
    const max = this.maxQuantity();
    return max > 0 ? (quantity / max) * 100 : 0;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
