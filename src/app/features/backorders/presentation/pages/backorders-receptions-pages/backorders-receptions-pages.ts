import { Component, inject, signal, OnInit } from '@angular/core';
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
import { ToastService } from '@app/shared/services/toast.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule } from '@angular/material/paginator';
import { AppPaginatorComponent } from '@app/shared/components/paginator/paginator.component';
import { BackOrdersApiService } from '@app/core/security/backorders-api.service';
import { AlertService } from '@app/shared/components/alert-dialog/alert.service';
import {
  ReceptionListItemDto,
  ReceptionLineDto,
  ReceptionPagedRequestDto,
  ReceptionStatus,
} from '@app/core/models/backorders-receptions.model';
import { AuthUser } from '../backorders-branch-pages/backorders-branch-pages';
import { BackOrdersReceptionsApiService } from '@app/core/security/backorders-receptions.service';
import { Router } from '@angular/router';
import { BranchesApiService } from '@app/core/security/branches-api.service';
import { Branch, BranchOption } from '@app/core/models/branch.models';
import { BranchSelectComponent } from '@app/shared/components/branch-select/branch-select.component';
import { ButtonComponent } from '@app/shared/components/button/button.component';
import { HasPermissionDirective } from '@app/core/directives/has-permission.directive';
import { PERMISSIONS } from '@app/core/security/permissions';
import { AuthStateService } from '@app/core/session/auth-state.service';


@Component({
  selector: 'app-backorders-receptions-pages',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    AppPaginatorComponent,
    BranchSelectComponent,
    ButtonComponent,
    MatMenuModule,
    MatDividerModule,
    HasPermissionDirective,
  ],
  templateUrl: './backorders-receptions-pages.html',
  styleUrl: './backorders-receptions-pages.scss',
})
export class BackordersReceptionsPages implements OnInit {
  protected readonly Permissions = PERMISSIONS;
  protected get canConfirmReception(): boolean {
    return this.authState.hasPermission(PERMISSIONS.supply.reception.confirm);
  }

  private readonly backOrderApi = inject(BackOrdersReceptionsApiService);
  private readonly authState = inject(AuthStateService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly dialog = inject(MatDialog);
  private readonly alertService = inject(AlertService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly ReceptionStatus = ReceptionStatus;

  readonly displayedColumns = ['folio', 'branchName', 'shipmentFolio', 'products', 'sentAt', 'status', 'actions'];

  readonly receptions = signal<ReceptionListItemDto[]>([]);
  readonly branches = signal<BranchOption[]>([]);
  readonly isLoading = signal(false);

  readonly searchControl = signal('');
  readonly selectedStatus = signal<number | null>(null);
  readonly selectedBranch = signal<number | null>(null);

  readonly pageIndex = signal(0);
  readonly pageSize = signal(50);
  readonly totalCount = signal(0);

  // Tab state
  readonly currentView = signal<'list' | 'detail'>('list');
  readonly selectedShipment = signal<ReceptionListItemDto | null>(null);
  receptionLines: ReceptionLineDto[] = [];
  currentBranch = '';
  currentUser = '';

  ngOnInit(): void {
    try {
      const user: AuthUser = JSON.parse(localStorage.getItem('user') || '{}');
      this.currentUser = user.name ?? '';
      this.currentBranch = (user as any).branchName ?? user.branches?.[0]?.name ?? '';
      const globalRoles = ['Admin', 'Administrador', 'Almacenista Principal'];
      const isGlobal = user.roles?.some(r => globalRoles.includes(r));
      if (!isGlobal && user.branches?.length > 0) {
        this.selectedBranch.set(user.branches[0].id);
      }
    } catch {}
    this.loadBranches();
    this.loadBackOrdes();
  }

  loadBranches(): void {
    this.branchesApi.getDestinationBranches().subscribe({
      next: (response) => this.branches.set(response.data),
      error: (err) => console.error('[BackordersReceptionsPages] loadBranches()', err),
    });
  }

  loadBackOrdes(): void {
    this.isLoading.set(true);

    const filter: ReceptionPagedRequestDto = {
      branchId: this.selectedBranch() || null,
      shipmentId: null,
      status: this.selectedStatus() || null,
      search: this.searchControl(),
      page: this.pageIndex() + 1,
      pageSize: this.pageSize(),
      dateFrom: null,
      dateTo: null,
      sortBy: null,
      sortDescending: true,
    };

    this.backOrderApi.GetReceptionsPaged(filter).subscribe({
      next: (response) => {
        this.receptions.set(response.data.items);
        this.totalCount.set(response.data.totalCount);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[BackordersReceptionsPages] loadBackOrdes()', err);
        this.isLoading.set(false);
        this.toast.error('Error al cargar recepciones', 'Error');
      },
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

  get filteredBackOrders() {
    return this.receptions();
  }

  clearFilters(): void {
    this.searchControl.set('');
    this.selectedBranch.set(null);
    this.selectedStatus.set(null);
    this.pageIndex.set(0);
    this.loadBackOrdes();
  }

  onStartReception(row: ReceptionListItemDto): void {
    const canConfirm = this.authState.hasPermission(PERMISSIONS.supply.reception.confirm);
    const modo = row.status === ReceptionStatus.Pendiente && canConfirm ? 'E' : 'C';
    this.router.navigate(['/backorder/receptions/detail', modo, row.id]);
  }

  onRowClick(row: ReceptionListItemDto): void {
    if (row.status !== ReceptionStatus.Pendiente) this.onStartReception(row);
  }

  onBack(): void {
    this.currentView.set('list');
  }

  onViewDetail(row: ReceptionListItemDto): void {
    this.router.navigate(['/backorder/receptions/detail', 'C', row.id]);
  }

  onConfirmReception(): void { }
  onQtyChange(_item: ReceptionLineDto): void { }
  onUploadPhoto(_item: ReceptionLineDto): void { }

  // Status helpers
  getStatusLabel(status: ReceptionStatus, fallback: string): string {
    if (status === ReceptionStatus.Pendiente) return 'En tránsito';
    if (status === ReceptionStatus.Recibida) return 'Recibida';
    if (status === ReceptionStatus.RecibidaConIncidencia) return 'Recibida con incidencia';
    return fallback;
  }

  getStatusClass(status: ReceptionStatus): string {
    const map: Record<number, string> = {
      [ReceptionStatus.Pendiente]: 'badge-info',
      [ReceptionStatus.Recibida]: 'badge-success',
      [ReceptionStatus.RecibidaConIncidencia]: 'badge-warning',
    };
    return map[status] ?? 'badge-neutral';
  }

  getRowClass(status: ReceptionStatus): string {
    return status !== ReceptionStatus.Pendiente ? 'row-muted' : '';
  }

  getLineRowClass(item: ReceptionLineDto): string {
    if (item.incidentQuantity > 0) return 'row-incident';
    if (item.receivedQuantity > 0) return 'row-ok';
    return '';
  }

  getReceivedInputClass(item: ReceptionLineDto): string {
    return item.receivedQuantity > 0 ? 'input-ok' : '';
  }

  getIncidentInputClass(item: ReceptionLineDto): string {
    return item.incidentQuantity > 0 ? 'input-incident' : '';
  }

  // Detail computed values
  get canConfirm(): boolean {
    return this.totalPending === 0 && this.receptionLines.length > 0;
  }

  get totalSent(): number {
    return this.receptionLines.reduce((s, l) => s + l.shippedQuantity, 0);
  }

  get totalReceived(): number {
    return this.receptionLines.reduce((s, l) => s + l.receivedQuantity, 0);
  }

  get totalIncident(): number {
    return this.receptionLines.reduce((s, l) => s + l.incidentQuantity, 0);
  }

  get totalPending(): number {
    return this.receptionLines.reduce(
      (s, l) => s + Math.max(0, l.shippedQuantity - l.receivedQuantity - l.incidentQuantity),
      0,
    );
  }

  get hasIncidents(): boolean {
    return this.receptionLines.some(l => l.incidentQuantity > 0);
  }

  get incidentLines(): ReceptionLineDto[] {
    return this.receptionLines.filter(l => l.incidentQuantity > 0);
  }

  // Metrics
  get countInTransit(): number {
    return this.receptions().filter(r => r.status === ReceptionStatus.Pendiente).length;
  }

  get countWithIncident(): number {
    return this.receptions().filter(r => r.status === ReceptionStatus.RecibidaConIncidencia).length;
  }

  get countDeliveredToday(): number {
    const today = new Date().toDateString();
    return this.receptions().filter(
      r => r.status === ReceptionStatus.Recibida &&
        r.receivedAt != null &&
        new Date(r.receivedAt).toDateString() === today,
    ).length;
  }
}
