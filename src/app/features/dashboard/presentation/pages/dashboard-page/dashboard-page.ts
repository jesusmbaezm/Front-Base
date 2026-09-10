import { Component, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { DashboardApiService } from '../../../../../core/security/dashboard-api.service';
import {
  DashboardRecentActivityItem,
  DashboardSummary,
  DashboardQuickIndicators,
} from '../../../../../core/models/dashboard.models';

interface DashboardMetric {
  title: string;
  value: string;
  icon: string;
  description: string;
  accentClass: string;
}

interface DashboardActivity {
  title: string;
  description: string;
  branchName: string;
  occurredAt: string;
  sourceType: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [DatePipe, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly dashboardApi = inject(DashboardApiService);

  private readonly isLoading = signal(false);
  private readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.loadDashboardData();
    });
  }

  private loadDashboardData(): void {
    this.isLoading.set(true);
    this.error.set(null);
  }

}
