import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BackorderItemDto } from '@app/core/models/backorders.model';
import { ShipmentDestinationGroupDto, ShipmentDto } from '@app/core/models/backorders-shipments.model';
import { BackOrdersShipmentsApiService } from '@app/core/security/backorders-shipments.service';
import { BranchesApiService } from '@app/core/security/branches-api.service';
import { Branch, BranchOption } from '@app/core/models/branch.models';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { ToastService } from '@app/shared/services/toast.service';
import { ShipmenteBranchFormDialog, BranchFormDialogResult } from './components/shipmente-branch-form-dialog/shipmente-branch-form-dialog';
import { ShipmentAddLineDialog, AddLineResult } from './components/shipment-add-line-dialog/shipment-add-line-dialog';
import { ShipmentPdfDialog } from './components/shipment-pdf-dialog/shipment-pdf-dialog';
import { documentsApiService } from '@app/core/security/documents-api.service';
import { HasPermissionDirective } from '@app/core/directives/has-permission.directive';
import { PERMISSIONS } from '@app/core/security/permissions';

export interface BranchLineItem {
  lineId?: number;
  backorderItemId?: number;
  productVariantId: number;
  sku: string;
  productName: string;
  variantDescription: string;
  pendingQuantity: number;
  availableStock: number;
  sendQuantity: number;
  lineComments: string;
  markedForDeletion?: boolean;
}

export interface BranchGroup {
  branchId: number;
  branchName: string;
  lines: BranchLineItem[];
  isPendingAdd: boolean;
  isLoadingLines: boolean;
  isSaving: boolean;
}

@Component({
  selector: 'app-backorders-shipments-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    HasPermissionDirective,
  ],
  templateUrl: './backorders-shipments-detail-page.html',
  styleUrl: './backorders-shipments-detail-page.scss',
})
export class BackordersShipmentsFormDialog implements OnInit {
  protected readonly Permissions = PERMISSIONS;
  private readonly fb = inject(FormBuilder);
  private readonly shipmentsApi = inject(BackOrdersShipmentsApiService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly documentsApi = inject(documentsApiService);

  readonly branchGroups = signal<BranchGroup[]>([]);
  readonly branches = signal<BranchOption[]>([]);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);

  private preferredBranchOrder: number[] | null = null;

  readonly shipmentFolio = signal('');
  readonly shipmentStatusLabel = signal('');
  readonly pendingRemoveDocument = signal(false);

  shipmentId = signal<number>(0);
  modo = signal<string>('A');

  form!: FormGroup;

  get isCreateMode(): boolean { return this.modo() === 'A'; }
  get isEditMode(): boolean { return this.modo() === 'E'; }

  get overAllocatedVariantIds(): Set<number> {
    const totals = new Map<number, { sent: number; available: number }>();
    for (const branch of this.branchGroups()) {
      for (const line of branch.lines) {
        if (line.markedForDeletion) continue;
        const cur = totals.get(line.productVariantId);
        if (cur) {
          cur.sent += line.sendQuantity;
        } else {
          totals.set(line.productVariantId, { sent: line.sendQuantity, available: line.availableStock });
        }
      }
    }
    const over = new Set<number>();
    totals.forEach((v, id) => { if (v.sent > v.available) over.add(id); });
    return over;
  }

  get hasOverAllocation(): boolean {
    return this.overAllocatedVariantIds.size > 0;
  }

  branchHasErrors(branch: BranchGroup): boolean {
    return branch.lines.some(l => this.lineHasError(l));
  }

  lineHasError(line: BranchLineItem): boolean {
    if (line.markedForDeletion) return false;
    return line.sendQuantity < 1 || this.overAllocatedVariantIds.has(line.productVariantId);
  }

  hasAnyErrors(): boolean {
    return this.hasOverAllocation || this.branchGroups().some(b => this.branchHasErrors(b));
  }

  get canConfirmShipment(): boolean {
    const hasTransportProvider = !!this.form?.get('transportProvider')?.value?.trim();
    const hasAtLeastOneProduct = this.branchGroups().some(b => b.lines.some(l => !l.markedForDeletion));
    return hasTransportProvider && hasAtLeastOneProduct && !this.hasAnyErrors();
  }

  activeLineCount(branch: BranchGroup): number {
    return branch.lines.filter(l => !l.markedForDeletion).length;
  }

  saveAllLines(): void {
    const emptyBranches = this.branchGroups().filter(b => b.lines.filter(l => !l.markedForDeletion).length === 0);
    if (emptyBranches.length > 0) {
      this.toast.error(`Las siguientes sucursales no tienen productos: ${emptyBranches.map(b => b.branchName).join(', ')}`);
      return;
    }
    this.isSubmitting.set(true);
    this.syncAndThen(() => {
      this.isSubmitting.set(false);
      this.toast.success('Embarque actualizado correctamente');
    });
  }

  private buildSyncPayload() {
    const fv = this.form.getRawValue();
    return {
      transportProvider: fv.transportProvider || null,
      vehiclePlate: fv.vehiclePlate || null,
      driverName: fv.driverName || null,
      driverLicenseNumber: fv.driverLicenseNumber || null,
      driverPhone: fv.driverPhone || null,
      comments: fv.comments || null,
      destinationBranchIds: this.branchGroups().map(b => b.branchId),
      linesToDelete: this.branchGroups()
        .flatMap(b => b.lines.filter(l => l.lineId && l.markedForDeletion))
        .map(l => l.lineId!),
      lineUpdates: this.branchGroups()
        .filter(b => !b.isPendingAdd)
        .flatMap(b => b.lines.filter(l => l.lineId && !l.markedForDeletion))
        .map(l => ({ lineId: l.lineId!, quantity: l.sendQuantity, lineComments: l.lineComments || null })),
      newLines: this.branchGroups()
        .flatMap(b => b.lines
          .filter(l => !l.lineId && !l.markedForDeletion)
          .map(l => ({
            branchId: b.branchId,
            backorderItemId: l.backorderItemId ?? null,
            productVariantId: l.productVariantId,
            quantity: l.sendQuantity,
            lineComments: l.lineComments || null,
          }))),
    };
  }

  private syncAndThen(onSuccess: () => void): void {
    const fv = this.form.getRawValue();
    const payload = this.buildSyncPayload();

    this.shipmentsApi.fullSyncShipment(this.shipmentId(), payload).subscribe({
      next: (res) => {
        this.branchGroups.set(this.mapDestinations(res.data.destinations));

        const transportFields = {
          transportProvider: fv.transportProvider || null,
          vehiclePlate: fv.vehiclePlate || null,
          driverName: fv.driverName || null,
          driverLicenseNumber: fv.driverLicenseNumber || null,
          driverPhone: fv.driverPhone || null,
          comments: fv.comments || null,
        };

        if (this.pendingRemoveDocument()) {
          const oldDocId = fv.attachedDocumentId;
          this.documentsApi.deleteDocument(oldDocId).subscribe({
            next: () => {
              this.shipmentsApi.updateShipmentAttachedDoc(this.shipmentId(), null, transportFields).subscribe({
                next: () => {
                  this.pendingRemoveDocument.set(false);
                  this.form.patchValue({ attachedDocumentId: null, attachedDocumentName: '' });
                  onSuccess();
                },
                error: () => { this.isSubmitting.set(false); this.toast.error('Error al actualizar embarque'); },
              });
            },
            error: () => { this.isSubmitting.set(false); this.toast.error('Error al eliminar el archivo'); },
          });
        } else if (fv.attachedFile) {
          const fd = new FormData();
          fd.append('EntityType', 'Shipment');
          fd.append('EntityId', this.shipmentId().toString());
          fd.append('DocumentType', 'Other');
          fd.append('File', fv.attachedFile, fv.attachedDocumentName);
          this.documentsApi.upload(fd).subscribe({
            next: (docRes) => {
              const newDocId = docRes.data?.id ?? docRes.id;
              this.shipmentsApi.updateShipmentAttachedDoc(this.shipmentId(), newDocId, transportFields).subscribe({
                next: () => {
                  this.form.patchValue({ attachedFile: null, attachedDocumentId: newDocId, attachedDocumentName: fv.attachedDocumentName });
                  onSuccess();
                },
                error: () => { this.isSubmitting.set(false); this.toast.error('Error al actualizar embarque'); },
              });
            },
            error: () => { this.isSubmitting.set(false); this.toast.error('Error al subir el archivo'); },
          });
        } else {
          onSuccess();
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toast.error(err.error?.message || 'Error al actualizar embarque');
      },
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe((p: Params) => {
      this.shipmentId.set(Number(p['shipmentId']) || 0);
      this.modo.set(p['modo'] || 'A');

      const navState = history.state;
      this.preferredBranchOrder = Array.isArray(navState?.['branchOrder']) ? navState['branchOrder'] : null;

      this.buildForm();
      this.loadBranches();
      if (this.shipmentId() > 0) {
        this.loadShipment();
      } else {
        this.isLoading.set(true);
      }
    });
  }

  buildForm(): void {
    this.form = this.fb.group({
      originBranchId: [{ value: null, disabled: true }],
      transportProvider: ['', Validators.required],
      vehiclePlate: [''],
      driverName: [''],
      driverLicenseNumber: [''],
      driverPhone: ['', [Validators.pattern(/^\d*$/), Validators.maxLength(10)]],
      comments: [''],
      attachedFile: [null],
      attachedDocumentId: [null],
      attachedDocumentName: [''],
    });
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 10);
    input.value = digits;
    this.form.get('driverPhone')?.setValue(digits, { emitEvent: false });
  }

  loadBranches(): void {
    this.branchesApi.getDestinationBranches().subscribe({
      next: (res) => {
        this.branches.set(res.data);
        const main = res.data.find(b => b.isMain);
        if (main && this.isCreateMode) {
          this.form.get('originBranchId')?.setValue(main.id);
        }
      },
    });
  }

  loadShipment(): void {
    this.shipmentsApi.getShipmentById(this.shipmentId()).subscribe({
      next: (res) => {
        const s = res.data;
        this.shipmentFolio.set(s.folio);
        this.shipmentStatusLabel.set(s.statusLabel);
        this.form.patchValue({
          originBranchId: s.originBranchId,
          transportProvider: s.transportProvider ?? '',
          vehiclePlate: s.vehiclePlate ?? '',
          driverName: s.driverName ?? '',
          driverLicenseNumber: s.driverLicenseNumber ?? '',
          driverPhone: s.driverPhone ?? '',
          comments: s.comments ?? '',
          attachedDocumentId: s.attachedDocumentId,
          attachedDocumentName: s.attachedDocumentFileName ?? '',
        });
        this.branchGroups.set(this.sortByPreferredOrder(this.mapDestinations(s.destinations)));
        this.isLoading.set(true);
      },
      error: () => {
        this.toast.error('Error al cargar el embarque');
        this.isLoading.set(true);
      },
    });
  }

  private sortByPreferredOrder(groups: BranchGroup[]): BranchGroup[] {
    if (!this.preferredBranchOrder) return groups;
    const order = this.preferredBranchOrder;
    return [...groups].sort((a, b) => {
      const ia = order.indexOf(a.branchId);
      const ib = order.indexOf(b.branchId);
      return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
    });
  }

  private mapDestinations(destinations: ShipmentDestinationGroupDto[]): BranchGroup[] {
    return destinations.map(d => ({
      branchId: d.branchId,
      branchName: d.branchName,
      isPendingAdd: false,
      isLoadingLines: false,
      isSaving: false,
      lines: d.lines.map(l => ({
        lineId: l.id,
        backorderItemId: l.backorderItemId ?? undefined,
        productVariantId: l.productVariantId,
        sku: l.sku,
        productName: l.productName,
        variantDescription: l.variantDescription,
        pendingQuantity: l.backorderPendingQuantity,
        availableStock: l.originAvailableQuantity,
        sendQuantity: l.quantity,
        lineComments: l.lineComments ?? '',
      })),
    }));
  }

  addBranch(): void {
    const originBranchId = this.form.getRawValue().originBranchId;
    const excludeBranchIds = [
      ...this.branchGroups().map(b => b.branchId),
      ...(originBranchId ? [originBranchId] : []),
    ];
    const dialogRef = this.dialog.open(ShipmenteBranchFormDialog, {
      panelClass: 'demo-dialog-panel',
      width: '480px',
      data: { excludeBranchIds },
    });

    dialogRef.afterClosed().subscribe((result: BranchFormDialogResult | null) => {
      if (!result) return;

      const pending: BranchGroup = {
        branchId: result.branchId,
        branchName: result.branchName,
        lines: [],
        isPendingAdd: true,
        isLoadingLines: true,
        isSaving: false,
      };
      this.branchGroups.update(g => [...g, pending]);

      this.shipmentsApi.getPendingBackorderForBranch(result.branchId).subscribe({
        next: (res) => {
          this.branchGroups.update(groups => groups.map(g => {
            if (g.branchId !== result.branchId) return g;
            return {
              ...g,
              isLoadingLines: false,
              lines: (res.data ?? []).map((item: BackorderItemDto) => {
                const pending = Math.max(0, item.quantity - item.inTransitQuantity - item.fulfilledQuantity);
                return {
                  backorderItemId: item.id,
                  productVariantId: item.productVariantId,
                  sku: item.sku,
                  productName: item.productName,
                  variantDescription: item.variantDescription,
                  pendingQuantity: pending,
                  availableStock: item.originAvailableStock,
                  sendQuantity: pending,
                  lineComments: '',
                };
              }),
            };
          }));
        },
        error: () => {
          this.branchGroups.update(g => g.filter(b => b.branchId !== result.branchId));
          this.toast.error('Error al cargar productos pendientes de la sucursal');
        },
      });
    });
  }

  addLineToBranch(branch: BranchGroup): void {
    const excludeVariantIds = branch.lines.map(l => l.productVariantId);
    const originBranchId = this.form.getRawValue().originBranchId ?? undefined;
    const dialogRef = this.dialog.open(ShipmentAddLineDialog, {
      panelClass: 'demo-dialog-panel',
      width: '600px',
      data: { shipmentId: this.shipmentId(), originBranchId, branchName: branch.branchName, excludeVariantIds },
    });

    dialogRef.afterClosed().subscribe((results: AddLineResult[] | null) => {
      if (!results?.length) return;
      this.branchGroups.update(groups => groups.map(g => {
        if (g.branchId !== branch.branchId) return g;
        const newLines: BranchLineItem[] = results.map(r => ({
          productVariantId: r.productVariantId,
          sku: r.sku,
          productName: r.productName,
          variantDescription: r.variantDescription,
          pendingQuantity: 0,
          availableStock: r.originAvailableStock,
          sendQuantity: r.quantity,
          lineComments: '',
        }));
        return { ...g, lines: [...g.lines, ...newLines] };
      }));
    });
  }

  cancelPendingBranch(branch: BranchGroup): void {
    this.branchGroups.update(g => g.filter(b => b.branchId !== branch.branchId));
  }

  removeBranch(branch: BranchGroup): void {
    if (branch.isPendingAdd || this.isCreateMode) {
      this.branchGroups.update(g => g.filter(b => b.branchId !== branch.branchId));
      return;
    }
    this.confirmDialog.confirm({
      variant: 'danger',
      title: 'Quitar sucursal',
      message: `¿Desea quitar "${branch.branchName}" del embarque? Se eliminarán sus líneas.`,
      confirmText: 'Quitar',
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.shipmentsApi.removeDestination(this.shipmentId(), branch.branchId).subscribe({
        next: () => {
          this.branchGroups.update(g => g.filter(b => b.branchId !== branch.branchId));
          this.toast.success('Sucursal eliminada');
        },
        error: (err) => this.toast.error(err.error?.message || 'Error al quitar sucursal'),
      });
    });
  }

  saveBranchLines(branch: BranchGroup): void {
    const linesWithId = branch.lines.filter(l => l.lineId);
    if (linesWithId.length === 0) return;

    this.setBranchSaving(branch.branchId, true);
    const payload = linesWithId.map(l => ({
      lineId: l.lineId!,
      quantity: l.sendQuantity,
      lineComments: l.lineComments || null,
    }));

    this.shipmentsApi.bulkUpdateShipmentLines(this.shipmentId(), payload).subscribe({
      next: () => {
        this.setBranchSaving(branch.branchId, false);
        this.toast.success('Cantidades guardadas');
      },
      error: (err) => {
        this.setBranchSaving(branch.branchId, false);
        this.toast.error(err.error?.message || 'Error al guardar cantidades');
      },
    });
  }

  deleteLine(branch: BranchGroup, line: BranchLineItem): void {
    if (!line.lineId) {
      this.removeLineLocal(branch, line);
      return;
    }
    this.toggleMarkedForDeletion(branch, line, true);
  }

  undoDeleteLine(branch: BranchGroup, line: BranchLineItem): void {
    this.toggleMarkedForDeletion(branch, line, false);
  }

  private toggleMarkedForDeletion(branch: BranchGroup, line: BranchLineItem, mark: boolean): void {
    this.branchGroups.update(groups => groups.map(g => {
      if (g.branchId !== branch.branchId) return g;
      return { ...g, lines: g.lines.map(l => l === line ? { ...l, markedForDeletion: mark } : l) };
    }));
  }

  createShipment(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.branchGroups().length === 0) {
      this.toast.error('Agrega al menos una sucursal destino');
      return;
    }

    this.isSubmitting.set(true);
    const fv = this.form.getRawValue();
    const formData = new FormData();

    if (fv.transportProvider) formData.append('transportProvider', fv.transportProvider);
    if (fv.vehiclePlate) formData.append('vehiclePlate', fv.vehiclePlate);
    if (fv.driverName) formData.append('driverName', fv.driverName);
    if (fv.driverLicenseNumber) formData.append('driverLicenseNumber', fv.driverLicenseNumber);
    if (fv.driverPhone) formData.append('driverPhone', fv.driverPhone);
    if (fv.comments) formData.append('comments', fv.comments);
    this.branchGroups().forEach(b => formData.append('destinationBranchIds', b.branchId.toString()));
    if (fv.attachedFile) formData.append('attachedFile', fv.attachedFile, fv.attachedDocumentName);

    // Snapshot user-adjusted quantities keyed by branchId:productVariantId
    const localQtyMap = new Map<string, { qty: number; comments: string }>();
    for (const branch of this.branchGroups()) {
      for (const line of branch.lines) {
        if (!line.markedForDeletion) {
          localQtyMap.set(`${branch.branchId}:${line.productVariantId}`, {
            qty: line.sendQuantity,
            comments: line.lineComments,
          });
        }
      }
    }
    const destinationBranchIds = this.branchGroups().map(b => b.branchId);

    this.shipmentsApi.createShipments(formData).subscribe({
      next: (res) => {
        const newShipmentId: number = res.data.id;
        const destinations: ShipmentDestinationGroupDto[] = res.data.destinations ?? [];

        const serverVariantKeys = new Set<string>();
        for (const dest of destinations) {
          for (const serverLine of dest.lines) {
            serverVariantKeys.add(`${dest.branchId}:${serverLine.productVariantId}`);
          }
        }

        const lineUpdates: { lineId: number; quantity: number; lineComments: string | null }[] = [];
        for (const dest of destinations) {
          for (const serverLine of dest.lines) {
            const local = localQtyMap.get(`${dest.branchId}:${serverLine.productVariantId}`);
            if (local && local.qty !== serverLine.quantity) {
              lineUpdates.push({ lineId: serverLine.id, quantity: local.qty, lineComments: local.comments || null });
            }
          }
        }

        const newLines: { branchId: number; backorderItemId: number | null; productVariantId: number; quantity: number; lineComments: string | null }[] = [];
        for (const branch of this.branchGroups()) {
          for (const line of branch.lines) {
            if (line.markedForDeletion) continue;
            if (!serverVariantKeys.has(`${branch.branchId}:${line.productVariantId}`)) {
              newLines.push({
                branchId: branch.branchId,
                backorderItemId: line.backorderItemId ?? null,
                productVariantId: line.productVariantId,
                quantity: line.sendQuantity,
                lineComments: line.lineComments || null,
              });
            }
          }
        }

        const branchOrder = this.branchGroups().map(b => b.branchId);
        const navigate = () => this.router.navigate(
          ['/backorder/shipment/detail', 'E', newShipmentId],
          { state: { branchOrder } },
        );

        if (lineUpdates.length === 0 && newLines.length === 0) {
          this.isSubmitting.set(false);
          this.toast.success('Embarque creado correctamente');
          navigate();
          return;
        }

        this.shipmentsApi.fullSyncShipment(newShipmentId, {
          destinationBranchIds,
          lineUpdates,
          newLines,
          transportProvider: fv.transportProvider || null,
          vehiclePlate: fv.vehiclePlate || null,
          driverName: fv.driverName || null,
          driverLicenseNumber: fv.driverLicenseNumber || null,
          driverPhone: fv.driverPhone || null,
          comments: fv.comments || null,
        }).subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.toast.success('Embarque creado correctamente');
            navigate();
          },
          error: () => {
            this.isSubmitting.set(false);
            this.toast.success('Embarque creado correctamente');
            navigate();
          },
        });
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toast.error(err.error?.message || 'Error al crear embarque');
      },
    });
  }

  openPdfDialog(): void {
    if (!this.shipmentId()) return;
    this.dialog.open(ShipmentPdfDialog, {
      width: '900px',
      maxWidth: '95vw',
      data: { shipmentId: this.shipmentId(), folio: this.shipmentFolio() },
    });
  }

  confirmShipment(): void {
    const emptyBranches = this.branchGroups().filter(b => b.lines.filter(l => !l.markedForDeletion).length === 0);
    if (emptyBranches.length > 0) {
      this.toast.error(`Las siguientes sucursales no tienen productos: ${emptyBranches.map(b => b.branchName).join(', ')}`);
      return;
    }

    this.confirmDialog.confirm({
      variant: 'primary',
      title: 'Confirmar envío',
      message: '¿Está seguro de marcar este embarque como "En tránsito"? Esta acción no se puede deshacer.',
      confirmText: 'Confirmar envío',
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.isSubmitting.set(true);
      this.syncAndThen(() => {
        this.shipmentsApi.confirmShipment(this.shipmentId()).subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.toast.success('Embarque confirmado, en tránsito');
            this.router.navigate(['/backorder/shipment']);
          },
          error: (err) => {
            this.isSubmitting.set(false);
            this.toast.error(err.error?.message || 'Error al confirmar embarque');
          },
        });
      });
    });
  }

  clearNewFile(fileInput: HTMLInputElement): void {
    this.form.get('attachedFile')?.setValue(null);
    this.form.get('attachedDocumentName')?.setValue('');
    fileInput.value = '';
  }

  markRemoveDocument(): void {
    this.pendingRemoveDocument.set(true);
    this.form.get('attachedFile')?.setValue(null);
  }

  undoRemoveDocument(): void {
    this.pendingRemoveDocument.set(false);
  }

  onSelectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) { this.form.get('attachedFile')?.setValue(null); return; }
    const maxSizeMB = 25;
    if (file.size > maxSizeMB * 1024 * 1024) {
      this.toast.error(`El archivo supera ${maxSizeMB} MB`);
      input.value = '';
      return;
    }
    this.form.get('attachedFile')?.setValue(file);
    this.form.get('attachedDocumentName')?.setValue(file.name);
  }

  onDownload(name: string): void {
    this.shipmentsApi.downloadDocument(this.shipmentId()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => this.toast.error('Error al descargar archivo'),
    });
  }

  goBack(): void {
    this.router.navigate(['/backorder/shipment']);
  }

  truncateFilename(name: string, maxChars = 20): string {
    if (!name) return '';
    const dotIndex = name.lastIndexOf('.');
    const ext = dotIndex !== -1 ? name.slice(dotIndex) : '';
    const base = dotIndex !== -1 ? name.slice(0, dotIndex) : name;
    if (base.length <= maxChars) return name;
    return base.slice(0, maxChars) + '...' + ext;
  }

  updateLineSendQuantity(branch: BranchGroup, line: BranchLineItem, value: number): void {
    const integer = Math.trunc(value);
    this.branchGroups.update(groups => groups.map(g => {
      if (g.branchId !== branch.branchId) return g;
      return { ...g, lines: g.lines.map(l => l === line ? { ...l, sendQuantity: integer } : l) };
    }));
  }

  private removeLineLocal(branch: BranchGroup, line: BranchLineItem): void {
    this.branchGroups.update(g => g.map(b => {
      if (b.branchId !== branch.branchId) return b;
      return { ...b, lines: b.lines.filter(l => l !== line) };
    }));
  }

  private setBranchSaving(branchId: number, saving: boolean): void {
    this.branchGroups.update(g => g.map(b => b.branchId === branchId ? { ...b, isSaving: saving } : b));
  }

  private loadShipmentReload(): void {
    this.shipmentsApi.getShipmentById(this.shipmentId()).subscribe({
      next: (res) => {
        this.branchGroups.set(this.mapDestinations(res.data.destinations));
      },
    });
  }
}
