import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { AlertService } from '@app/shared/components/alert-dialog/alert.service';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { ToastService } from '@app/shared/services/toast.service';
import { BackOrdersShipmentsApiService } from '@app/core/security/backorders-shipments.service';
import { ShipmentFilter, ShipmentListItemDto } from '@app/core/models/backorders-shipments.model';
import { BranchesApiService } from '@app/core/security/branches-api.service';
import { Branch, BranchOption } from '@app/core/models/branch.models';
import { Router } from '@angular/router';
import { AppPaginatorComponent } from '@app/shared/components/paginator/paginator.component';
import { ButtonComponent } from '@app/shared/components/button/button.component';
import { HasPermissionDirective } from '@app/core/directives/has-permission.directive';
import { PERMISSIONS } from '@app/core/security/permissions';
import { AuthStateService } from '@app/core/session/auth-state.service';

@Component({
  selector: 'app-backorders-shipments-pages',
  standalone: true,
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
    MatMenuModule,
    AppPaginatorComponent,
    ButtonComponent,
    HasPermissionDirective,
  ],
  templateUrl: './backorders-shipments-pages.html',
  styleUrl: './backorders-shipments-pages.scss',
})
export class BackordersShipmentsPages implements OnInit {
  protected readonly Permissions = PERMISSIONS;
  private readonly BackOrderShipmentsApi = inject(BackOrdersShipmentsApiService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly dialog = inject(MatDialog);
  private readonly alertService = inject(AlertService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly router = inject(Router);
  private readonly authState = inject(AuthStateService);
  dataSource!: MatTableDataSource<ShipmentListItemDto>;

  readonly displayedColumns = ['folio', 'transportProvider', 'shippedAt', 'receivedAt', 'receptionCount', 'status', 'actions'];

  readonly backorders = signal<ShipmentListItemDto[]>([]);
  readonly branches = signal<BranchOption[]>([]);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly mainBranchName = signal('');
  readonly branchCheckDone = signal(false);

  readonly hasMainBranch = computed(() => {
    const userBranchIds = new Set(this.authState.user()?.branches.map(b => b.id) ?? []);
    return this.branches().some(b => b.isMain && userBranchIds.has(b.id));
  });

  readonly searchControl = signal('');
  readonly selectedBranch = signal<number | null>(null);
  readonly selectedStatus = signal<number | null>(null);

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalCount = signal(0);

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource(this.backorders());
    this.loadBranches();
  }

  get filteredBackOrders() {
    return this.backorders();
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page - 1);
    this.loadShipments();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(0);
    this.loadShipments();
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 1: return 'badge-neutral';
      case 2: return 'badge-info';
      case 3: return 'badge-success';
      default: return 'badge-neutral';
    }
  }

  getStatusLabel(status: number): string {
    switch (status) {
      case 1: return 'Pendiente';
      case 2: return 'En tránsito';
      case 3: return 'Entregado';
      default: return 'Desconocido';
    }
  }

  btnAddShipment(): void {
    this.router.navigate(['/backorder/shipment/detail', 'A', 0]);
  }

  btnEdit(shipmentId: number, modo: string): void {
    if (modo === 'C') {
      this.router.navigate(['/backorder/shipment/detail/consult', shipmentId]);
    } else {
      this.router.navigate(['/backorder/shipment/detail', modo, shipmentId]);
    }
  }

  btnDelateLine(shipment: ShipmentListItemDto): void {
    this.confirmDialog
      .confirm({
        variant: 'danger',
        title: 'Confirmar eliminación',
        message: `¿Está seguro de eliminar el embarque "${shipment.folio}"?`,
        confirmText: 'Eliminar',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.isSubmitting.set(true);
          this.BackOrderShipmentsApi.deleteShipments(shipment.id).subscribe({
            next: (response) => {
              this.isSubmitting.set(false);
              this.loadShipments();
              this.toast.success(
                response.message || `Embarque ${shipment.folio} eliminado exitosamente`,
                'Éxito',
              );
            },
            error: (err) => {
              this.isSubmitting.set(false);
              const message = err.error?.message || 'Error al eliminar el embarque';
              console.error('[ShipmentsPage] deleteShipment()', err);
              this.toast.error(message, 'Error');
            },
          });
        }
      });
  }

  loadBranches(): void {
    this.branchesApi.getDestinationBranches().subscribe({
      next: (response) => {
        this.branches.set(response.data);
        const globalMain = response.data.find(b => b.isMain);
        this.mainBranchName.set(globalMain?.name || '');
        this.branchCheckDone.set(true);
        if (this.hasMainBranch()) {
          this.loadShipments();
        }
      },
      error: (err) => {
        console.error('[ShipmentsPage] loadBranches()', err);
        this.branchCheckDone.set(true);
      },
    });
  }

  loadShipments(): void {
    this.isLoading.set(true);

    const filter: ShipmentFilter = {
      BranchId: this.selectedBranch() || null,
      dateFrom: null,
      dateTo: null,
      sortBy: null,
      sortDescending: true,
      status: this.selectedStatus() || null,
      search: this.searchControl() || null,
      page: this.pageIndex() + 1,
      pageSize: this.pageSize(),
    };

    this.BackOrderShipmentsApi.getShipmentsPaged(filter).subscribe({
      next: (response) => {
        this.backorders.set(response.data.items);
        this.dataSource.data = this.backorders();
        this.totalCount.set(response.data.totalCount);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.backorders.set([]);
        this.dataSource = new MatTableDataSource(this.backorders());
        console.error('[ShipmentsPage] loadShipments()', err);
        this.isLoading.set(false);
        this.toast.error('Error al cargar embarques', 'Error');
      },
    });
  }

  clearFilters(): void {
    this.searchControl.set('');
    this.selectedBranch.set(null);
    this.selectedStatus.set(null);
    this.pageIndex.set(0);
    this.loadShipments();
  }
}
