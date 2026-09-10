import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { ShipmentDestinationGroupDto, ShipmentDto, ShipmentLineCreateDto, ShipmentLineDto } from '@app/core/models/backorders-shipments.model';
import { BackOrdersShipmentsApiService } from '@app/core/security/backorders-shipments.service';
import { BranchesApiService } from '@app/core/security/branches-api.service';
import { AlertService } from '@app/shared/components/alert-dialog/alert.service';
import { ToastService } from '@app/shared/services/toast.service';
import { devNull } from 'os';
import { HttpErrorResponse } from '@angular/common/http';
import { BackOrdersReceptionsApiService } from '@app/core/security/backorders-receptions.service';
import { ReceptionConfirmSimpleDto, ReceptionDto, ReceptionLineDto, ReceptionLineUpdateFormRequest } from '@app/core/models/backorders-receptions.model';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltip, MatTooltipModule } from "@angular/material/tooltip";
import { ButtonComponent } from '@app/shared/components/button/button.component';
import { HasPermissionDirective } from '@app/core/directives/has-permission.directive';
import { PERMISSIONS } from '@app/core/security/permissions';
import { ShipmentPdfDialog } from '../../../backorders-shipment-detail-pages/components/shipment-pdf-dialog/shipment-pdf-dialog';

@Component({
  selector: 'app-backorders-shipments-consult-details-page',
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
    ButtonComponent,
    HasPermissionDirective,
  ],
  templateUrl: './backorders-shipments-consult-details-page.html',
  styleUrl: './backorders-shipments-consult-details-page.scss',
})
export class BackordersShipmentsConsultDetailsPage {
  protected readonly Permissions = PERMISSIONS;

  private readonly fb = inject(FormBuilder);
  private readonly BackOrderShipmentsApi = inject(BackOrdersShipmentsApiService);
  private readonly alertService = inject(AlertService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  dataSource!: MatTableDataSource<any>;

  readonly displayedColumns = ['branchName'];

  readonly isSubmitting = signal(false);
  readonly Listbranches = signal<ShipmentDestinationGroupDto[]>([]);
  readonly isLoading = signal(false);

  shipmentId = signal<number>(0);
  modo = signal<string>('');
  branchId = signal<number>(0);
  shipmentStatus = signal<number>(0);

  originalValues: any[] = [];

  formTable!: FormGroup;
  expandedElement: ShipmentDestinationGroupDto | null = null;
  errorFile = signal<string>('');

  get rows(): FormArray {
    return this.formTable.get('rows') as FormArray;
  }

  form!: FormGroup;
  formConfirm!: FormGroup;

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource();
    this.route.params.subscribe((p: Params) => {
      this.shipmentId.set(Number(p["shipmentId"]));
    });
    this.getDetailsShipment();
  }

  getDetailsShipment(): void {
    this.BackOrderShipmentsApi.getShipmentById(this.shipmentId()).subscribe({
        next: (response) => {
          
          this.formBuilderShipment(response.data);
          this.shipmentStatus.set(response.data.status);
          if (Array.isArray(response.data.destinations) && response.data.destinations.length > 0) {
            this.Listbranches.set(response.data.destinations);
            this.dataSource.data = response.data.destinations;
          } else {
            this.Listbranches.set([]);
            //this.dataSource = new MatTableDataSource(this.Activities);
            //this.dataSource.data = [];
          }
          this.isLoading.set(true);
        },
        error: (error: any) => {
          //this.notificationService.error(this.findTranslation("proposal-load-error-message"));
        },
      });
  }

  goBack(): void {
    this.router.navigate(["/backorder/shipment"]);
  }

  goEdit(): void {
    this.router.navigate(["/backorder/shipment/detail", "E", this.shipmentId()]);
  }

  openPdfDialog(): void {
    if (!this.shipmentId()) return;
    this.dialog.open(ShipmentPdfDialog, {
      width: '900px',
      maxWidth: '95vw',
      data: { shipmentId: this.shipmentId(), folio: this.form?.value?.folio ?? '' },
    });
  }

  btnExpandable(branch: ShipmentDestinationGroupDto): void {
    this.expandedElement = this.expandedElement === branch ? null : branch;
  }

  /*btnEditLine(line: any): void {

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
  }*/

  editRow(index: any) {
    const row = index;//this.rows.at(index);
    // guardar copia para cancelar
    this.originalValues[index] = { ...row.value };

    row.get('isEditing')?.setValue(true);
  }

  onDownload(name: string): void {
    this.BackOrderShipmentsApi.downloadDocument(this.shipmentId()).subscribe({
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
        console.error('[ShipmentConsultPage] onDownload()', err);
        this.toast.error('Error al descargar evidencia', 'Error');
      },
    });
  }

  /*saveRow(index: any) {
    
    const row = index;//this.rows.at(index);

    //row.get('isEditing')?.setValue(false);

    let hasIncident = false;
    const incidentQuantity = Number(row.value.incidentQuantity);
    if (incidentQuantity >= 1) {
      hasIncident = true;
    }

    const updateBackorder: ReceptionLineUpdateFormRequest = {
      receivedQuantity: row.value.receivedQuantity,
      hasIncident: hasIncident,
      incidentComments: row.value.incidentComments,
      incidentQuantity: row.value.incidentQuantity,
      lineComments: row.value.lineComments,
      file: row.value.attachedFile,
    };

    const formData = new FormData();
    this.formDataMapping(formData, updateBackorder);

    this.backOrderApi.UpdateReceptionLine(this.receptionId(), row.value.id, formData).subscribe({
      next: (response) => {
        
        this.toast.success("Cantidad de producto modificado correctamente");
        this.getDetailsShipment();
      },
      error: (err: HttpErrorResponse) => {

        this.toast.error("Error al actualizar producto");
      }, //some manipulation with response
    });
  }*/

  cancelEdit(index: any) {
    const row = index;//this.rows.at(index);

    // restaurar valores originales
    row.patchValue(this.originalValues[index]);

    row.get('isEditing')?.setValue(false);
  }

  onSelectFile(event: Event, index: any): void {
    const row = this.rows.at(index);
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    //this.imageErrorAfter = null;

    if (!file) {
      row.value.attachedFile = null;
      //this.imagePreviewAfter = null;
      return;
    }

    /* if (!file.type.startsWith('image/')) {
      this.imageErrorAfter = 'Solo se permiten archivos de imagen.';
      this.clearImageAfter(input);
      return;
    } */

    const maxSizeMB = 25;
    if (file.size > maxSizeMB * 1024 * 1024) {
      this.errorFile.set(`La imagen supera ${maxSizeMB} MB.`);
      this.clearFile(row, input);
      return;
    }
    row.value.attachedFile = file;
    row.value.attachedFileName = file.name;
    
    this.dataSource.data = this.rows.controls;
    //this.setFormValue(3, 'attachedFile', file);
    //this.setFormValue(3, 'attachedFileName', file.name);
    //const reader = new FileReader();
    //reader.onload = () => (this.imagePreviewAfter = reader.result as string);
    //reader.readAsDataURL(file);
  }

  formBuilderShipment(shipment: ShipmentDto): void {
    this.form = this.fb.group({
      folio:  [{ value: shipment.folio, disabled: true }],
      status:  [{ value: shipment.statusLabel, disabled: true }],
      originBranchId: [{ value: shipment.originBranchId, disabled: true }],
      originBranchName: [{ value: shipment.originBranchName, disabled: true }],
      transportProvider: [{ value: shipment.transportProvider, disabled: true }],
      vehiclePlate: [{ value: shipment.vehiclePlate, disabled: true }],
      driverName: [{ value: shipment.driverName, disabled: true }],
      driverLicenseNumber: [{ value: shipment.driverLicenseNumber, disabled: true }],
      driverPhone: [{ value: shipment.driverPhone, disabled: true }],
      comments: [{ value: shipment.comments, disabled: true }],
      createdAt: [{ value: shipment.createdAt, disabled: true }],
      shippedAt: [{ value: shipment.shippedAt, disabled: true }],
      shippedByUserName: [{ value: shipment.shippedByUserName, disabled: true }],
      deliveredAt: [{ value: shipment.deliveredAt, disabled: true }],
      attachedDocumentId: [{ value: shipment.attachedDocumentId, disabled: true }],
      attachedDocumentName: [{ value: shipment.attachedDocumentFileName, disabled: true }]
    });
  }

  formBuilderShipmentDestination(shipment: ShipmentDestinationGroupDto): void {
    this.form = this.fb.group({
      branchId: [{ value: shipment.branchId, disabled: true }],
      branchName: [{ value: shipment.branchName, disabled: true }],
    });
  }

  formBuilderTable(): void {
    this.formTable = this.fb.group({
      rows: this.fb.array<FormGroup>([])
    });
  }

  createRow(shipment: ShipmentLineDto): FormGroup {
    const group = this.fb.group({
      id: [{ value: shipment.id, disabled: true }],
      destinationBranch: [{ value: shipment.destinationBranchName, disabled: true }],
      productId: [{ value: shipment.productId, disabled: true }],
      productVariantId: [{ value: shipment.productVariantId, disabled: true }],
      sku: [{ value: shipment.sku, disabled: true }],
      productName: [{ value: shipment.productName, disabled: true }],
      variantDescription: [{ value: shipment.variantDescription, disabled: true }],
      quantity: [{ value: shipment.quantity, disabled: true }],
      backorderPendingQuantity: [{ value: shipment.backorderPendingQuantity, disabled: true }],
      originAvailableQuantity: [{ value: shipment.originAvailableQuantity, disabled: true }],
      backorderItemId: [{ value: shipment.backorderItemId, disabled: true }],
      lineComments: [{ value: shipment.lineComments, disabled: true }],
      isEditing: [false]
    });

    return group;
  }

  clearFile(row: any, fileInput?: HTMLInputElement): void {
    row.value.attachedFile = null;
    row.value.attachedFileName = '';
    //this.imagePreviewAfter = null;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  formDataMapping(formData: FormData, model: any): void {
    Object.keys(model).forEach((key: string) => {
      // Si es null, mandar cadena vacía (opcional)
      if (model[key] === null || model[key] === undefined) {
        formData.append(key, "");
        return;
      }

      // Si NO es Activities (lista), agregar normal
      if (key !== "file") {
        formData.append(key, model[key].toString());
      }
      else if (key == "file") {
        const imgFile = model[key];
        if (imgFile) {
          formData.append("IncidentFile", imgFile, imgFile.name);
        }
      }
    });

  }

  getFormValue(form: number, value: any): any | null {
    return this.getFormElement(form, value).value;
  }

  getFormElement(form: number, value: any): any | null {
    if (form == 1)
      return this.form.get(value);
    else if (form == 2)
      return this.formConfirm.get(value);
    else if (form == 3)
      return this.formTable.get(value);
  }

  setFormValue(form: number, name: string, data: any) {
    this.getFormElement(form, name).setValue(data);
  }

  getFormConfirmValue(value: any): any | null {
    return this.setFormConfirmElement(value).value;
  }

  setFormConfirmElement(value: any): any | null {
    return this.formConfirm.get(value);
  }

  getStatusClass(): string {
    switch (this.shipmentStatus()) {
      case 1: return 'badge-neutral';
      case 2: return 'badge-info';
      case 3: return 'badge-success';
      default: return 'badge-neutral';
    }
  }

  truncateFilename(name: string, maxChars = 18): string {
    if (!name) return '';
    const dotIndex = name.lastIndexOf('.');
    const ext = dotIndex !== -1 ? name.slice(dotIndex) : '';
    const base = dotIndex !== -1 ? name.slice(0, dotIndex) : name;
    if (base.length <= maxChars) return name;
    return base.slice(0, maxChars) + '...' + ext;
  }
}
