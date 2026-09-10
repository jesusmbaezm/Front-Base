import { CommonModule } from '@angular/common';
import { Component, inject, Signal, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { ToastService } from '@app/shared/services/toast.service';
import { BackordersShipmentsLinesFormDialog } from './componets/backorders-shipments-lines-form-dialog/backorders-shipments-lines-form-dialog';
import { devNull } from 'os';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSort } from "@angular/material/sort";
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-backorders-shipments-lines-pages',
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
    MatSort,
    MatMenuModule,
    MatDividerModule,
],
  templateUrl: './backorders-shipments-lines-pages.html',
  styleUrl: './backorders-shipments-lines-pages.scss',
})
export class BackordersShipmentsLinesPages {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly BackOrderShipmentsApi = inject(BackOrdersShipmentsApiService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  dataSource!: MatTableDataSource<ShipmentLineDto>;

  readonly displayedColumns = ['product','availableInventory','branchAvailableStock','outstandingAmount','quantitySend','comments','actions'];

  readonly isSubmitting = signal(false);
  readonly ListShipmentLine = signal<ShipmentLineDto[]>([]);
  readonly isLoading = signal(false);

  modo = signal<string>('');
  shipmentId = signal<number>(0);
  branchId = signal<number>(0);
  selectBranchName = signal<string>('');
  originalValues: any[] = [];

  formTable!: FormGroup;

  get rows(): FormArray {
    return this.formTable.get('rows') as FormArray;
  }
  
  form!: FormGroup;

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource(this.ListShipmentLine());
    this.route.params.subscribe((p: Params) => {
      this.shipmentId.set(Number(p["shipmentId"]));
      this.branchId.set(Number(p["branchId"]));
      this.modo.set(p["modo"]);
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

  

  btnAddLine(): void {
    const line = {
      destinationBranchId: this.branchId(),
    } as ShipmentLineCreateDto;
    const dialogRef = this.dialog.open(BackordersShipmentsLinesFormDialog, {
      panelClass: 'demo-dialog-panel',
      width: '500px',
      data: { line, isEdit: false }
    });

    dialogRef.afterClosed().subscribe((result: ShipmentLineCreateDto) => {
      if (result) {
        
        this.BackOrderShipmentsApi.createShipmentLine(this.shipmentId(),result).subscribe({
          next: (response) => {
            
            this.toast.success("Producto agregado correctamente", '');
            this.getDetailsShipment();
          },
          error: (err: HttpErrorResponse) => {

            this.toast.error("Error al agregar nuevo producto", '');
          }, //some manipulation with response
        });
        //this.branchesPending().push(result);
        //this.dataSource.data = this.branchesPending();
      }
    });
  }

  btnEditLine(line: any): void {
    
    const lineDialog = {
      destinationBranchId: this.branchId(),
      productVariantId: line.productVariantId,
      quantity: line.quantity,
      lineComments: line.lineComments
    } as ShipmentLineCreateDto;
    
    const dialogRef = this.dialog.open(BackordersShipmentsLinesFormDialog, {
      panelClass: 'demo-dialog-panel',
      width: '500px',
      data: { line: lineDialog, isEdit: true }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        
        this.BackOrderShipmentsApi.updateShipmentLine(this.shipmentId(),line.id,result).subscribe({
          next: (response) => {
            
            this.toast.success("Cantidad de producto modificado correctamente", '');
            this.getDetailsShipment();
          },
          error: (err: HttpErrorResponse) => {

            this.toast.error("Error al actualizar producto", '');
          }, //some manipulation with response
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(["/backorder/shipment/detail",this.modo(), this.shipmentId()]);
  }

  btnDelateLine(line: any): void {
    this.confirmDialog
      .confirm({
        variant: 'danger',
        title: 'Confirmar eliminación',
        message: `¿Está seguro de eliminar el producto "${line.productName} - ${line.variantDescription}"?`,
        confirmText: 'Eliminar',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.isSubmitting.set(true);
          this.BackOrderShipmentsApi.delateShipmentLine(this.shipmentId(), line.id!).subscribe({
            next: (response) => {
              this.isSubmitting.set(false);
              this.toast.success(
                response.message || 'producto eliminado exitosamente',
                'Éxito',
              );
              this.getDetailsShipment();
            },
            error: (err) => {
              this.isSubmitting.set(false);
              const message = err.error?.message || 'Error al eliminar el producto';
              console.error('[CategoriesPage] deleteCategory()', err);
              this.toast.error(message, 'Error');
            },
          });
        }
      });
  }

  editRow(index: number) {
      const row = this.rows.at(index);
  
      // guardar copia para cancelar
      this.originalValues[index] = { ...row.value };
  
      row.get('isEditing')?.setValue(true);
    }
  
    saveRow(index: number) {
      const row = this.rows.at(index);
  
      //row.get('isEditing')?.setValue(false);
  
      //const data = row.value;
  
      
  
      const updateBackorder: ShipmentLineCreateDto = {
          destinationBranchId: row.value.branchId,
          productVariantId: row.value.productVariantId,
          quantity: row.value.quantity, 
          lineComments: row.value.lineComments
        };
  
      this.BackOrderShipmentsApi.updateShipmentLine(this.shipmentId(),row.value.id,updateBackorder).subscribe({
          next: (response) => {
            
            this.toast.success("Cantidad de producto modificado correctamente", '');
            this.getDetailsShipment();
          },
          error: (err: HttpErrorResponse) => {

            this.toast.error("Error al actualizar producto", '');
          }, //some manipulation with response
        });

      // aquí llamas API
      // this.service.update(data).subscribe(...)
    }
  
    cancelEdit(index: number) {
      const row = this.rows.at(index);
  
      // restaurar valores originales
      row.patchValue(this.originalValues[index]);
  
      row.get('isEditing')?.setValue(false);
    }

  getDetailsShipment(): void {
    this.BackOrderShipmentsApi.getShipmentById(this.shipmentId()).subscribe({
        next: (response) => {
          //
          /*if (this.modo() != "C" && (response.Proposal.PreviousLevelId == null && response.Proposal.isLegacy  && (response.Proposal.Nivel?.Code == 'IML-06' || response.Proposal.Nivel?.Code == 'IML-05' || response.Proposal.Nivel?.Code == 'IML-04'))  ) {
            this.notificationService.error(this.findTranslation("proposal-legacy-no-edit-message"));
            this.router.navigate(["/proposal"]);
          }*/
         
          this.formBuilder(response.data);
          this.selectBranchName.set(response.data.destinations.find(f => f.branchId == this.branchId())?.branchName || "");
          if (Array.isArray(response.data.destinations) && response.data.destinations.length > 0) {
            this.ListShipmentLine.set(response.data.destinations.find(f => f.branchId == this.branchId())?.lines || []);
            this.formBuilderTable();
            this.ListShipmentLine().forEach(d => this.rows.push(this.createRow(d)));
            
            this.dataSource.data = this.ListShipmentLine();
          } else {
            this.ListShipmentLine.set([]);
            this.dataSource = new MatTableDataSource(this.ListShipmentLine());
            this.dataSource.data = [];
          }
          this.isLoading.set(true);
        },
        error: (error: any) => {
          //this.notificationService.error(this.findTranslation("proposal-load-error-message"));
        },
      });
  }

  /*getBranchDisplayName(id: Number): string {
    const attrs = this.ListBranches().find(f => f.id == id)?.name || "";
    return attrs;
  }*/

  formBuilder(shipment: ShipmentDto): void {
    this.form = this.fb.group({
      Folio: [{ value: shipment.folio, disabled: true }],
      Branch: [{ value: shipment.destinations.find(f => f.branchId == this.branchId())?.branchName, disabled: true }],
      Status: [{ value: shipment.statusLabel, disabled: true }],
    });
  }

  formBuilderTable(): void {
    this.formTable = this.fb.group({
      rows: this.fb.array<FormGroup>([])
    });
  }

  createRow(data: ShipmentLineDto): FormGroup {
      const group = this.fb.group({
        id: [data.id],
        branchId: [data.destinationBranchId],
        productVariantId: [data.productVariantId],
        branchName: [data.destinationBranchName],
        sku: [data.sku],
        productName: [data.productName],
        variantDescription: [data.variantDescription],
        quantity: [data.quantity],
        branchAvailableStock: [data.branchAvailableStock],
        originAvailableQuantity: [data.originAvailableQuantity],
        backorderPendingQuantity: [data.backorderPendingQuantity],
        lineComments: [data.lineComments],
        isEditing: [false]
      });
      if(this.modo() == "C")
        group.disable();
      return group;
    }

  getFormValue(value: any): any | null {
    return this.getFormElement(value).value;
  }

  getFormElement(value: any): any | null {
    return this.form.get(value);
  }

  setFormValue(name: string, data: any) {
    this.getFormElement(name).setValue(data);
  }
}
