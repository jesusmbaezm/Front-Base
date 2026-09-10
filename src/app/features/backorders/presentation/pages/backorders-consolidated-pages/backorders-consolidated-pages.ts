import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { BackOrdersApiService } from '@app/core/security/backorders-api.service';
import { AlertService } from '@app/shared/components/alert-dialog/alert.service';
import { BackOrdersFilter, ConsolidatedBackorderDto } from '@app/core/models/backorders.model';
import { BranchesApiService } from '@app/core/security/branches-api.service';
import { Branch, BranchOption } from '@app/core/models/branch.models';
import { ConsolidatedBackordersApiService } from '@app/core/security/backorders-consolidated.service';
import { ToastService } from '@app/shared/services/toast.service';
import { AppPaginatorComponent } from '@app/shared/components/paginator/paginator.component';
import { ButtonComponent } from '@app/shared/components/button/button.component';
import { CategorySelectComponent } from '@app/shared/components/category-select/category-select.component';
import { HasPermissionDirective } from '@app/core/directives/has-permission.directive';
import { PERMISSIONS } from '@app/core/security/permissions';
import { AuthStateService } from '@app/core/session/auth-state.service';

export type ConsolidatedTableRow =
  | { type: 'group'; categoryName: string }
  | { type: 'item'; data: ConsolidatedBackorderDto; categoryName: string };

@Component({
  selector: 'app-backorders-consolidated-pages',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    AppPaginatorComponent,
    ButtonComponent,
    CategorySelectComponent,
    HasPermissionDirective,
  ],
  templateUrl: './backorders-consolidated-pages.html',
  styleUrl: './backorders-consolidated-pages.scss',
})
export class BackordersConsolidatedPages implements OnInit {
  protected readonly Permissions = PERMISSIONS;
  private readonly ConsolidatedBackOrderApi = inject(ConsolidatedBackordersApiService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly dialog = inject(MatDialog);
  private readonly alertService = inject(AlertService);
  private readonly toast = inject(ToastService);
  private readonly authState = inject(AuthStateService);

  readonly displayedColumns = ['branchName', 'product', 'quantity', 'fulfilledQuantity', 'branchAvailableStock', 'originAvailableStock'];

  readonly backorders = signal<ConsolidatedBackorderDto[]>([]);
  readonly branches = signal<BranchOption[]>([]);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly mainBranchName = signal('');
  readonly branchCheckDone = signal(false);

  // La sucursal principal existe Y el usuario la tiene asignada
  readonly hasMainBranch = computed(() => {
    const userBranchIds = new Set(this.authState.user()?.branches.map(b => b.id) ?? []);
    return this.branches().some(b => b.isMain && userBranchIds.has(b.id));
  });

  readonly searchControl = signal('');
  readonly selectedBranch = signal<number | null>(null);
  readonly selectedCategory = signal<number | null>(null);
  readonly tableRows = signal<ConsolidatedTableRow[]>([]);
  readonly collapsedCategories = signal<Set<string>>(new Set());

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalCount = signal(0);

  isGroupRow = (_: number, row: ConsolidatedTableRow): boolean => row.type === 'group';

  get visibleTableRows(): ConsolidatedTableRow[] {
    const collapsed = this.collapsedCategories();
    return this.tableRows().filter(row =>
      row.type === 'group' || !collapsed.has(row.categoryName)
    );
  }

  toggleCategory(categoryName: string): void {
    this.collapsedCategories.update(set => {
      const next = new Set(set);
      next.has(categoryName) ? next.delete(categoryName) : next.add(categoryName);
      return next;
    });
  }

  isCollapsed(categoryName: string): boolean {
    return this.collapsedCategories().has(categoryName);
  }

  ngOnInit(): void {
    this.loadBranches();
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page - 1);
    this.loadBackOrdes();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(0);
    this.loadBackOrdes();
  }

  btnExportToExcel(): void {
    this.exportToExcel();
  }

  loadBranches(): void {
    this.branchesApi.getDestinationBranches().subscribe({
      next: (response) => {
        this.branches.set(response.data);
        const globalMain = response.data.find(b => b.isMain);
        this.mainBranchName.set(globalMain?.name || '');
        this.branchCheckDone.set(true);
        if (this.hasMainBranch()) {
          this.loadBackOrdes();
        }
      },
      error: (err) => {
        console.error('[ConsolidatedPage] loadBranches()', err);
        this.branchCheckDone.set(true);
      },
    });
  }

  loadBackOrdes(): void {
    this.isLoading.set(true);

    const filter: BackOrdersFilter = {
      branchId: this.selectedBranch() ?? undefined,
      categoryId: this.selectedCategory() ?? undefined,
      search: this.searchControl() || undefined,
      page: this.pageIndex() + 1,
      pageSize: this.pageSize(),
    };

    this.ConsolidatedBackOrderApi.getConsolidatedBackOrdersPaged(filter).subscribe({
      next: (response) => {
        const items: ConsolidatedBackorderDto[] = response.data.items;
        this.backorders.set(items);
        this.totalCount.set(response.data.totalCount);

        const rows: ConsolidatedTableRow[] = [];
        const byCat = new Map<string, ConsolidatedBackorderDto[]>();
        for (const item of items) {
          const cat = item.categoryName || 'Sin categoría';
          if (!byCat.has(cat)) byCat.set(cat, []);
          byCat.get(cat)!.push(item);
        }
        for (const [catName, catItems] of byCat) {
          rows.push({ type: 'group', categoryName: catName });
          for (const item of catItems) {
            rows.push({ type: 'item', data: item, categoryName: catName });
          }
        }

        this.tableRows.set(rows);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[ConsolidatedPage] loadBackOrdes()', err);
        this.isLoading.set(false);
        this.toast.error('Error al cargar backorders', 'Error');
      },
    });
  }

  exportToExcel(): void {
    const filter: BackOrdersFilter = {
      search: this.searchControl() || undefined,
      branchId: this.selectedBranch() ?? undefined,
      categoryId: this.selectedCategory() ?? undefined,
    };

    this.isSubmitting.set(true);
    this.ConsolidatedBackOrderApi.exportBackOrder(filter).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backorders_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('[ConsolidatedPage] exportToExcel()', err);
        this.toast.error('No fue posible exportar el archivo.', 'Error');
        this.isSubmitting.set(false);
      },
    });
  }

  clearFilters(): void {
    this.searchControl.set('');
    this.selectedBranch.set(null);
    this.selectedCategory.set(null);
    this.pageIndex.set(0);
    this.loadBackOrdes();
  }
}
