import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { ToastService } from '@app/shared/services/toast.service';
import { BackorderItemCreateDto, BackorderItemDto, BackorderItemUpdateDto, BackOrdersFilter } from '@app/core/models/backorders.model';
import { BackOrdersFormDialog, BackOrdersFormDialogData } from './components/backorders-branch-form-dialog';
import { BranchesApiService } from '@app/core/security/branches-api.service';
import { Branch } from '@app/core/models/branch.models';
import { BranchSelectComponent } from '@app/shared/components/branch-select/branch-select.component';
import { CategorySelectComponent } from '@app/shared/components/category-select/category-select.component';
import { AppPaginatorComponent } from '@app/shared/components/paginator/paginator.component';
import { ButtonComponent } from '@app/shared/components/button/button.component';
import { HasPermissionDirective } from '@app/core/directives/has-permission.directive';
import { PERMISSIONS } from '@app/core/security/permissions';

export interface SimpleBranch {
  id: number;
  name: string;
}

export interface AuthUser {
  id: number | string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  branches: SimpleBranch[];
}

export type BranchTableRow =
  | { type: 'group'; categoryName: string }
  | { type: 'item'; formGroup: FormGroup; formIndex: number; categoryName: string };

@Component({
  selector: 'app-backorders-branch-pages',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
    BranchSelectComponent,
    CategorySelectComponent,
    AppPaginatorComponent,
    ButtonComponent,
    HasPermissionDirective,
  ],
  templateUrl: './backorders-branch-pages.html',
  styleUrl: './backorders-branch-pages.scss',
})
export class BackordersBranchPages implements OnInit {
  protected readonly Permissions = PERMISSIONS;
  private readonly backOrderApi = inject(BackOrdersApiService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly isGlobal = signal(false);
  readonly displayedColumns = signal(['product', 'quantity', 'fulfilledQuantity', 'actions']);

  readonly backorders = signal<BackorderItemDto[]>([]);
  readonly branches = signal<Branch[]>([]);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);

  originalValues: any[] = [];
  readonly searchControl = signal('');
  readonly selectedStatus = signal<boolean | null>(null);
  readonly selectedBranch = signal<number | null>(null);
  readonly selectedCategory = signal<number | null>(null);
  readonly tableRows = signal<BranchTableRow[]>([]);
  readonly collapsedCategories = signal<Set<string>>(new Set());

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalCount = signal(0);

  form!: FormGroup;

  isGroupRow = (_: number, row: BranchTableRow): boolean => row.type === 'group';

  get visibleTableRows(): BranchTableRow[] {
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

  get rows(): FormArray {
    return this.form.get('rows') as FormArray;
  }

  ngOnInit(): void {
    const user: AuthUser = JSON.parse(localStorage.getItem('user') || '{}');
    const globalRoles = ['Admin', 'Administrador', 'Almacenista Principal'];
    const isGlobal = user.roles?.some(r => globalRoles.includes(r));
    this.isGlobal.set(!!isGlobal);
    if (isGlobal) {
      this.displayedColumns.set(['branchName', 'product', 'quantity', 'fulfilledQuantity', 'actions']);
    }
    if (!isGlobal && user.branches?.length > 0) {
      this.selectedBranch.set(user.branches[0].id);
    }
    this.loadBranches();
    this.loadBackOrdes();
  }

  formBuilder(): void {
    this.form = this.fb.group({
      rows: this.fb.array<FormGroup>([])
    });
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

  editRow(formIndex: number) {
    const row = this.rows.at(formIndex);
    this.originalValues[formIndex] = { ...row.value };
    row.get('isEditing')?.setValue(true);
  }

  saveRow(formIndex: number) {
    const row = this.rows.at(formIndex);

    const updateBackorder: BackorderItemUpdateDto = {
      quantity: row.value.quantity,
    };

    const request$ = this.backOrderApi.updateBackOrder(
      row.value.id,
      updateBackorder as BackorderItemUpdateDto,
    );

    request$.subscribe({
      next: (response) => {
        this.toast.success(response.message || 'Backorder actualizada exitosamente', 'Éxito');
        this.loadBackOrdes();
      },
      error: (err) => {
        const message = err.error?.message || 'Error al actualizar backorder';
        console.error('[BackordersBranchPages] saveRow()', err);
        this.toast.error(message, 'Error');
      },
    });
  }

  cancelEdit(formIndex: number) {
    const row = this.rows.at(formIndex);
    row.patchValue(this.originalValues[formIndex]);
    row.get('isEditing')?.setValue(false);
  }

  loadBackOrdes(): void {
    this.isLoading.set(true);

    const filter: BackOrdersFilter = {
      branchId: this.selectedBranch() ?? undefined,
      pendingOnly: this.selectedStatus() ?? undefined,
      categoryId: this.selectedCategory() ?? undefined,
      search: this.searchControl() || undefined,
      page: this.pageIndex() + 1,
      pageSize: this.pageSize(),
    };

    this.backOrderApi.getBackOrdersPaged(filter).subscribe({
      next: (response) => {
        this.formBuilder();
        const items: BackorderItemDto[] = response.data.items;
        this.backorders.set(items);
        this.totalCount.set(response.data.totalCount);

        const rows: BranchTableRow[] = [];
        let formIndex = 0;
        const byCat = new Map<string, BackorderItemDto[]>();
        for (const item of items) {
          const cat = item.categoryName || 'Sin categoría';
          if (!byCat.has(cat)) byCat.set(cat, []);
          byCat.get(cat)!.push(item);
        }
        for (const [catName, catItems] of byCat) {
          rows.push({ type: 'group', categoryName: catName });
          for (const item of catItems) {
            const fg = this.createRow(item);
            this.rows.push(fg);
            rows.push({ type: 'item', formGroup: fg, formIndex, categoryName: catName });
            formIndex++;
          }
        }

        this.tableRows.set(rows);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[BackordersBranchPages] loadBackOrdes()', err);
        this.isLoading.set(false);
      },
    });
  }

  loadBranches(): void {
    let user: AuthUser = JSON.parse(localStorage.getItem("user") || "");
    let branchUser = user.branches.map(m => m.id);
    const allowedIds = new Set(branchUser);
    this.branchesApi.getUserBranches().subscribe({
      next: (response) => {
        this.branches.set(response.data.filter(d => allowedIds.has(d.id)));
      },
      error: (err) => console.error('[BackordersBranchPages] loadBranches()', err),
    });
  }

  createRow(data: BackorderItemDto): FormGroup {
    return this.fb.group({
      id: [data.id],
      branchId: [data.branchId],
      productVariantId: [data.productVariantId],
      branchName: [data.branchName],
      sku: [data.sku],
      productName: [data.productName],
      variantDescription: [data.variantDescription],
      quantity: [data.quantity],
      inTransitQuantity: [data.inTransitQuantity],
      fulfilledQuantity: [data.fulfilledQuantity],
      isEditing: [false]
    });
  }

  async openCreateDialog(): Promise<void> {
    let user: AuthUser = JSON.parse(localStorage.getItem("user") || "");
    const branchId = this.selectedBranch();
    const branch = user.branches.find(b => b.id === branchId);
    let backorder = {
      branchId: branchId,
      branchName: branch?.name ?? ''
    } as BackorderItemDto;

    const dialogRef = this.dialog.open<BackOrdersFormDialog, BackOrdersFormDialogData, boolean>(
      BackOrdersFormDialog,
      {
        panelClass: 'demo-dialog-panel',
        width: '600px',
        disableClose: true,
        data: { BackOrder: backorder, isEdit: false },
      },
    );

    const component = dialogRef.componentInstance;

    component.submitForm.subscribe(
      (result: { data: BackorderItemCreateDto | BackorderItemUpdateDto, isEdit: boolean }) => {
        component.setSubmitting(true);

        const request$ = this.backOrderApi.createBackOrder(result.data as BackorderItemCreateDto);

        request$.subscribe({
          next: (response) => {
            component.setSubmitting(false);
            dialogRef.close(true);
            this.toast.success(response.message || 'Backorder creada exitosamente', 'Éxito');
            this.loadBackOrdes();
          },
          error: (err) => {
            component.setSubmitting(false);
            const message = err.error?.message || 'Error al crear backOrder';
            console.error('[BackordersBranchPages] openCreateDialog()', err);
            this.toast.error(message, 'Error');
          },
        });
      },
    );
  }

  clearFilters(): void {
    this.searchControl.set('');
    this.selectedBranch.set(null);
    this.selectedCategory.set(null);
    this.pageIndex.set(0);
    this.loadBackOrdes();
  }
}
