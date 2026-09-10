import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { ShipmentDto, ShipmentLineCreateDto, ShipmentLineDto } from '@app/core/models/backorders-shipments.model';
import { BackOrdersShipmentsApiService } from '@app/core/security/backorders-shipments.service';
import { BranchesApiService } from '@app/core/security/branches-api.service';
import { AlertService } from '@app/shared/components/alert-dialog/alert.service';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { ToastService } from '@app/shared/services/toast.service';
import { HttpErrorResponse } from '@angular/common/http';
import { BackordersReceptionsFormDialog } from '../backorders-receptions-form-dialog/backorders-receptions-form-dialog';
import { PhotoManagerDialogComponent } from './photo-manager-dialog';
import { BackOrdersReceptionsApiService } from '@app/core/security/backorders-receptions.service';
import { ReceptionConfirmSimpleDto, ReceptionDto, ReceptionLineDto, ReceptionStatus } from '@app/core/models/backorders-receptions.model';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltip, MatTooltipModule } from "@angular/material/tooltip";
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AuthStateService } from '@app/core/session/auth-state.service';
import { PERMISSIONS } from '@app/core/security/permissions';

@Component({
  selector: 'app-backorders-receptions-details-page',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatDividerModule,
    MatTooltipModule,
],
  templateUrl: './backorders-receptions-details-page.html',
  styleUrl: './backorders-receptions-details-page.scss',
})
export class BackordersReceptionsDetailsPage {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly backOrderApi = inject(BackOrdersReceptionsApiService);
  private readonly BackOrderShipmentsApi = inject(BackOrdersShipmentsApiService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly previewCache = new Map<File, SafeUrl>();
  docPreviewCache: Record<number, SafeUrl | null> = {};
  private readonly docLoadingIds = new Set<number>();
  private readonly alertService = inject(AlertService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authState = inject(AuthStateService);

  dataSource!: MatTableDataSource<any>;

  readonly displayedColumns = ['product', 'shippedQuantity', 'receivedQuantity', 'incidentQuantity', 'incidentComments', 'actions'];

  readonly isSubmitting = signal(false);
  readonly ListReceptionLine = signal<ReceptionLineDto[]>([]);
  readonly isLoading = signal(false);

  receptionId = signal<number>(0);
  modo = signal<string>('');
  branchId = signal<number>(0);

  originalValues: any[] = [];
  formSubmitted = false;

  activeRowIndex: number | null = null;
  activeCommentText = '';
  popoverX = 0;
  popoverY = 0;

  photoPopoverRowIndex: number | null = null;
  photoPopoverX = 0;
  photoPopoverY = 0;
  readonly maxPhotos = 10;

  formTable!: FormGroup;
  expandedElement: ReceptionLineDto | null = null;
  errorFile = signal<string>('');

  get rows(): FormArray {
    return this.formTable.get('rows') as FormArray;
  }

  form!: FormGroup;
  formConfirm!: FormGroup;

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource();
    this.route.params.subscribe((p: Params) => {
      this.receptionId.set(Number(p["receptionId"]));
      const canConfirm = this.authState.hasPermission(PERMISSIONS.supply.reception.confirm);
      this.modo.set(p["modo"] === 'E' && !canConfirm ? 'C' : p["modo"]);
    });
    this.getDetailsShipment();
  }

  /*onSubmit(): void {
     
     if (this.form.invalid) return;
 
     this.isSubmitting.set(true);
     const formValue = this.form.value;
 
       const updatePayload = {
         branchId: Number(this.getFormValue("BranchId")),
         branchName: this.getBranchDisplayName(Number(this.getFormValue("BranchId"))), 
       } as ShipmentDestinationGroupDto;
       this.dialogRef.close(updatePayload);
   }*/



  /*btnAddLine(): void {
    const line = {
      destinationBranchId: this.branchId(),
    } as ShipmentLineCreateDto;
    const dialogRef = this.dialog.open(BackordersReceptionsFormDialog, {
      width: '500px',
      data: { line, isEdit: false }
    });

    dialogRef.afterClosed().subscribe((result: ShipmentLineCreateDto) => {
      if (result) {
        
        this.BackOrderShipmentsApi.createShipmentLine(this.shipmentId(), result).subscribe({
          next: (response) => {
            
            this.alertService.confirm('', "Producto agregado correctamente");
            this.getDetailsShipment();
          },
          error: (err: HttpErrorResponse) => {
            
            this.alertService.error('', "Error al agregar nuevo producto");
          }, //some manipulation with response
        });
        //this.branchesPending().push(result);
        //this.dataSource.data = this.branchesPending();
      }
    });
  }*/
goBack(): void {
  this.router.navigate(["/backorder/receptions"]);
}

onConfirm(): void {
  this.formSubmitted = true;

  if (!this.canConfirm) return;

  this.confirmDialog.confirm({
    variant: 'primary',
    title: 'Confirmar entrega',
    message: '¿Está seguro de confirmar la recepción del embarque?',
    confirmText: 'Confirmar',
  }).subscribe((confirmed) => {
    if (!confirmed) return;

    this.isSubmitting.set(true);

    const saveRequests = this.rows.controls.map(row => {
      const formData = new FormData();
      formData.append('receivedQuantity', String(row.value.receivedQuantity ?? 0));
      formData.append('incidentQuantity', String(row.value.incidentQuantity ?? 0));
      formData.append('hasIncident', String((row.value.incidentQuantity ?? 0) >= 1));
      if (row.value.incidentComments) formData.append('incidentComments', row.value.incidentComments);
      if (row.value.lineComments) formData.append('lineComments', row.value.lineComments);
      const files: File[] = row.get('attachedFiles')?.value ?? [];
      files.forEach(f => formData.append('IncidentFiles', f, f.name));
      return this.backOrderApi.UpdateReceptionLine(this.receptionId(), row.value.id, formData);
    });

    forkJoin(saveRequests).pipe(
      switchMap(() => {
        const confirmPayload: ReceptionConfirmSimpleDto = {
          comments: this.getFormConfirmValue('Comments'),
        };
        return this.backOrderApi.ConfirmReception(this.receptionId(), confirmPayload);
      })
    ).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.toast.success(response.message || 'Entrega confirmada', 'Éxito');
        this.router.navigate(['/backorder/receptions']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toast.error(err.error?.message || 'Error al confirmar entrega', 'Error');
      },
    });
  });
}

  btnEditLine(line: any): void {
    
    const lineDialog = {
      destinationBranchId: this.branchId(),
      productVariantId: line.productVariantId,
      quantity: line.quantity,
      lineComments: line.lineComments
    } as ShipmentLineCreateDto;

    const dialogRef = this.dialog.open(BackordersReceptionsFormDialog, {
      panelClass: 'demo-dialog-panel',
      width: '500px',
      data: { line: lineDialog, isEdit: true }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        
        this.backOrderApi.UpdateReceptionLine(this.receptionId(), line.id, result).subscribe({
          next: (response) => {

            this.toast.success("Cantidad de producto modificado correctamente");
            this.getDetailsShipment();
          },
          error: (err: HttpErrorResponse) => {

            this.toast.error("Error al actualizar producto");
          }, //some manipulation with response
        });
      }
    });
  }

  cancelEdit(index: any) {
      const row = index;//this.rows.at(index);
  
      // restaurar valores originales
      row.patchValue(this.originalValues[index]);
  
      row.get('isEditing')?.setValue(false);
    }

  onSelectFile(event: Event, index: number): void {
    const row = this.rows.at(index);
    const input = event.target as HTMLInputElement;
    const newFiles = Array.from(input.files ?? []);
    input.value = '';

    const maxSizeMB = 25;
    const oversized = newFiles.find(f => f.size > maxSizeMB * 1024 * 1024);
    if (oversized) {
      this.errorFile.set(`"${oversized.name}" supera ${maxSizeMB} MB.`);
      return;
    }

    const current: File[] = row.get('attachedFiles')?.value ?? [];
    row.get('attachedFiles')?.setValue([...current, ...newFiles]);
    this.dataSource.data = this.rows.controls;
  }

  openCommentPopover(rowIndex: number, event: MouseEvent): void {
    event.stopPropagation();
    const row = this.rows.at(rowIndex);
    this.activeRowIndex = rowIndex;
    this.activeCommentText = row.get('incidentComments')?.value ?? '';

    const trigger = event.currentTarget as HTMLElement;
    const rect = trigger.getBoundingClientRect();
    const popoverHeight = 200;
    const popoverWidth = 340;

    this.popoverX = Math.max(8, rect.right - popoverWidth);
    this.popoverY = rect.top - popoverHeight - 8;
    if (this.popoverY < 8) this.popoverY = rect.bottom + 8;
  }

  saveCommentPopover(): void {
    if (this.activeRowIndex !== null) {
      this.rows.at(this.activeRowIndex).get('incidentComments')?.setValue(this.activeCommentText);
    }
    this.activeRowIndex = null;
  }

  closeCommentPopover(): void {
    this.activeRowIndex = null;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.comment-popover') && !target.closest('.comment-trigger'))
      this.activeRowIndex = null;
    if (!target.closest('.photo-popover') && !target.closest('.btn-photo'))
      this.photoPopoverRowIndex = null;
  }

  getDocPreview(id: number): SafeUrl | null | undefined {
    if (id in this.docPreviewCache) return this.docPreviewCache[id];
    return undefined;
  }

  private isImageFileName(fileName: string): boolean {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
  }

  private loadDocPreview(lineId: number, id: number, fileName: string): void {
    if (this.docLoadingIds.has(id) || id in this.docPreviewCache) return;
    this.docLoadingIds.add(id);
    this.backOrderApi.downloadLineDocument(lineId, id).subscribe({
      next: (blob) => {
        this.docLoadingIds.delete(id);
        const isImage = blob.type.startsWith('image/') || this.isImageFileName(fileName);
        if (isImage) {
          const imageBlob = blob.type.startsWith('image/') ? blob : new Blob([blob], { type: this.getMimeByExt(fileName) });
          const url = URL.createObjectURL(imageBlob);
          this.docPreviewCache = { ...this.docPreviewCache, [id]: this.sanitizer.bypassSecurityTrustUrl(url) };
        } else {
          this.docPreviewCache = { ...this.docPreviewCache, [id]: null };
        }
      },
      error: () => {
        this.docLoadingIds.delete(id);
        this.docPreviewCache = { ...this.docPreviewCache, [id]: null };
      },
    });
  }

  private getMimeByExt(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
    const map: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp' };
    return map[ext] ?? 'application/octet-stream';
  }

  getPreview(file: File): SafeUrl | null {
    if (!file.type.startsWith('image/')) return null;
    if (!this.previewCache.has(file)) {
      const url = URL.createObjectURL(file);
      this.previewCache.set(file, this.sanitizer.bypassSecurityTrustUrl(url));
    }
    return this.previewCache.get(file) ?? null;
  }

  openPhotoPopover(rowIndex: number, event: MouseEvent): void {
    event.stopPropagation();
    this.photoPopoverRowIndex = rowIndex;
    this.activeRowIndex = null;

    if (this.modo() === 'C') {
      const lineId: number = this.rows.at(rowIndex).value.id;
      const docs: { id: number; fileName: string }[] = this.rows.at(rowIndex).value.existingDocuments ?? [];
      docs.forEach(doc => this.loadDocPreview(lineId, doc.id, doc.fileName));
    }

    const trigger = event.currentTarget as HTMLElement;
    const rect = trigger.getBoundingClientRect();
    const popoverWidth = 340;
    const popoverHeight = 260;

    this.photoPopoverX = Math.max(8, rect.right - popoverWidth);
    this.photoPopoverY = rect.top - popoverHeight - 8;
    if (this.photoPopoverY < 8) this.photoPopoverY = rect.bottom + 8;
  }

  closePhotoPopover(): void {
    this.photoPopoverRowIndex = null;
  }

  onPhotoFileAdd(event: Event): void {
    if (this.photoPopoverRowIndex === null) return;
    const row = this.rows.at(this.photoPopoverRowIndex);
    const input = event.target as HTMLInputElement;
    const newFiles = Array.from(input.files ?? []);
    input.value = '';
    const current: File[] = row.get('attachedFiles')?.value ?? [];
    const slots = this.maxPhotos - current.length;
    row.get('attachedFiles')?.setValue([...current, ...newFiles.slice(0, slots)]);
  }

  removePhotoFromPopover(fileIndex: number): void {
    if (this.photoPopoverRowIndex === null) return;
    this.removeAttachedFile(this.photoPopoverRowIndex, fileIndex);
  }

  openPhotoManager(rowIndex: number): void {
    const row = this.rows.at(rowIndex);
    const current: File[] = row.get('attachedFiles')?.value ?? [];

    this.dialog.open(PhotoManagerDialogComponent, {
      panelClass: 'demo-dialog-panel',
      width: '480px',
      data: { files: [...current] },
    }).afterClosed().subscribe((result: File[] | undefined) => {
      if (result !== undefined) {
        row.get('attachedFiles')?.setValue(result);
      }
    });
  }

  removeAttachedFile(rowIndex: number, fileIndex: number): void {
    const row = this.rows.at(rowIndex);
    const current: File[] = row.get('attachedFiles')?.value ?? [];
    current.splice(fileIndex, 1);
    row.get('attachedFiles')?.setValue([...current]);
    this.dataSource.data = this.rows.controls;
  }

  onDownload(lineId: number, documentId: number, name: string): void {
    this.backOrderApi.downloadLineDocument(lineId, documentId).subscribe({
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
      error: (err) => {
        console.error('[PeriodDetailPage] downloadEvidence()', err);
        this.toast.error('Error al descargar evidencia', 'Error');
      },
    });
  }

  getDetailsShipment(): void {
    this.backOrderApi.getReceptionById(this.receptionId()).subscribe({
      next: (response) => {
        //
        /*if (this.modo() != "C" && (response.Proposal.PreviousLevelId == null && response.Proposal.isLegacy  && (response.Proposal.Nivel?.Code == 'IML-06' || response.Proposal.Nivel?.Code == 'IML-05' || response.Proposal.Nivel?.Code == 'IML-04'))  ) {
          this.notificationService.error(this.findTranslation("proposal-legacy-no-edit-message"));
          this.router.navigate(["/proposal"]);
        }*/
        
        this.formBuilder(response.data);
        if (Array.isArray(response.data.lines) && response.data.lines.length > 0) {
          this.ListReceptionLine.set(response.data.lines);
          
          
          this.formBuilderTable();
          this.ListReceptionLine().forEach(d => this.rows.push(this.createRow(d)));
          this.dataSource.data = this.rows.controls;
        } else {
          this.ListReceptionLine.set([]);
          this.dataSource = new MatTableDataSource();
          this.dataSource.data = [];
        }
        this.isLoading.set(true);
      },
      error: (error: any) => {
        //this.notificationService.error(this.findTranslation("proposal-load-error-message"));
      },
    });
  }

  formBuilder(shipment: ReceptionDto): void {
    this.form = this.fb.group({
      Folio: [{ value: shipment.folio, disabled: true }],
      FolioEmbarque: [{ value: shipment.shipmentFolio, disabled: true }],
      Branch: [{ value: shipment.branchName, disabled: true }],
      OriginBranch: [{ value: shipment.originBranchName, disabled: true }],
      fecha: [{ value: shipment.receivedAt, disabled: true }],
      fechaAt: [{ value: shipment.createdAt, disabled: true }],
      StatusEnum: [{ value: shipment.status, disabled: true }],
      Status: [{ value: shipment.statusLabel, disabled: true }],
      Comments: [{ value: shipment.comments, disabled: true }],
    });
    this.formConfirm = this.fb.group({
      Comments: [''],
    });
  }

  formBuilderTable(): void {
    this.formTable = this.fb.group({
      rows: this.fb.array<FormGroup>([])
    });
  }

  createRow(data: ReceptionLineDto): FormGroup {
      const group = this.fb.group({
        id: [data.id],
        productId: [data.productId],
        productVariantId: [data.productVariantId],
        shipmentLineId: [data.shipmentLineId],
        sku: [data.sku],
        productName: [data.productName],
        variantDescription: [data.variantDescription],
        shippedQuantity: [data.shippedQuantity],
        receivedQuantity: [data.receivedQuantity],
        lineComments: [data.lineComments],
        hasIncident: [data.hasIncident],
        incidentQuantity: [data.incidentQuantity],
        incidentComments: [data.incidentComments],
        attachedFiles: [[] as File[]],
        existingDocuments: [data.incidentDocuments ?? []],
        isEditing: [false]
      });

      if(this.modo() == "C") 
        group.disable();

      return group;
    }

  clearFile(row: any, fileInput?: HTMLInputElement): void {
    row.get('attachedFiles')?.setValue([]);
    if (fileInput) fileInput.value = '';
  }

  formDataMapping(formData: FormData, model: any): void {
    Object.keys(model).forEach((key: string) => {
      if (key === 'files') {
        const files: File[] = model[key] ?? [];
        files.forEach(f => formData.append('IncidentFiles', f, f.name));
        return;
      }
      if (model[key] === null || model[key] === undefined) {
        formData.append(key, '');
        return;
      }
      formData.append(key, model[key].toString());
    });
  }

  getFormValue(form: number, value: any): any | null {
      return this.getFormElement(form, value).value;
  }

  getFormElement(form: number, value: any): any | null {
    if(form == 1)
      return this.form.get(value);
    else if(form == 2)
      return this.formConfirm.get(value);
    else if(form == 3)
      return this.formTable.get(value);
  }

  setFormValue(form: number,name: string, data: any) {
    this.getFormElement(form, name).setValue(data);
  }

  getFormConfirmValue(value: any): any | null {
    return this.setFormConfirmElement(value).value;
  }

  setFormConfirmElement(value: any): any | null {
    return this.formConfirm.get(value);
  }

  get statusLabel(): string {
    const s = this.form?.value.StatusEnum;
    if (s === ReceptionStatus.Pendiente) return 'En tránsito';
    if (s === ReceptionStatus.Recibida) return 'Recibida';
    if (s === ReceptionStatus.RecibidaConIncidencia) return 'Recibida con incidencia';
    return this.form?.value.Status ?? '';
  }

  get statusBadgeClass(): string {
    const map: Record<number, string> = {
      [ReceptionStatus.Pendiente]: 'badge-info',
      [ReceptionStatus.Recibida]: 'badge-success',
      [ReceptionStatus.RecibidaConIncidencia]: 'badge-warning',
    };
    return map[this.form?.value.StatusEnum] ?? 'badge-neutral';
  }

  asFormGroup(ctrl: AbstractControl): FormGroup {
    return ctrl as FormGroup;
  }

  get totalSent(): number {
    return this.rows?.controls.reduce((s, r) => s + (r.value.shippedQuantity || 0), 0) ?? 0;
  }

  get totalReceived(): number {
    return this.rows?.controls.reduce((s, r) => s + (r.value.receivedQuantity || 0), 0) ?? 0;
  }

  get totalIncident(): number {
    return this.rows?.controls.reduce((s, r) => s + (r.value.incidentQuantity || 0), 0) ?? 0;
  }

  get totalPending(): number {
    return this.rows?.controls.reduce(
      (s, r) => s + Math.max(0, (r.value.shippedQuantity || 0) - (r.value.receivedQuantity || 0) - (r.value.incidentQuantity || 0)),
      0,
    ) ?? 0;
  }

  get totalCaptured(): number {
    return this.totalReceived + this.totalIncident;
  }

  rowCaptured(row: AbstractControl): number {
    return (row.value.receivedQuantity || 0) + (row.value.incidentQuantity || 0);
  }

  rowDiff(row: AbstractControl): number {
    return (row.value.shippedQuantity || 0) - this.rowCaptured(row);
  }

  get hasIncidents(): boolean {
    return this.rows?.controls.some(r => r.value.incidentQuantity > 0) ?? false;
  }

  get incidentRows(): AbstractControl[] {
    return this.rows?.controls.filter(r => r.value.incidentQuantity > 0) ?? [];
  }

  get hasMissingComments(): boolean {
    return this.rows?.controls.some(r => r.value.incidentQuantity > 0 && !r.value.incidentComments) ?? false;
  }

  get hasMissingEvidence(): boolean {
    return this.rows?.controls.some(r => r.value.incidentQuantity > 0 && !(r.get('attachedFiles')?.value?.length > 0)) ?? false;
  }

  get canConfirm(): boolean {
    return !this.hasMissingComments && !this.hasMissingEvidence && (this.rows?.length ?? 0) > 0;
  }

  getLineRowClass(row: AbstractControl): string {
    if (row.value.incidentQuantity > 0) return 'row-incident';
    if (row.value.receivedQuantity > 0) return 'row-ok';
    return '';
  }

  getReceivedClass(row: AbstractControl): string {
    return row.value.receivedQuantity > 0 ? 'input-ok' : '';
  }

  getIncidentClass(row: AbstractControl): string {
    return row.value.incidentQuantity > 0 ? 'input-incident' : '';
  }

}
