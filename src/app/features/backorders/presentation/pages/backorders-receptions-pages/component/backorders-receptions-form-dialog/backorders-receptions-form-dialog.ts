import { Component, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  BackorderItemDto,
  BackorderItemCreateDto,
  BackorderItemUpdateDto,
} from '@app/core/models/backorders.model';
import { ProductsApiService } from '@app/core/security/products-api.service';
import { ProductVariant } from '@app/core/models/product-variant.model';
import { ReceptionLineUpdateFormRequest } from '@app/core/models/backorders-receptions.model';

export interface ReceptionFormDialogData {
    BackOrder?: ReceptionLineUpdateFormRequest;
    isEdit: boolean;
}

@Component({
  selector: 'app-backorders-receptions-form-dialog',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './backorders-receptions-form-dialog.html',
  styleUrl: './backorders-receptions-form-dialog.scss',
})
export class BackordersReceptionsFormDialog {
  @Output() submitForm = new EventEmitter<{
    data: ReceptionLineUpdateFormRequest;
    isEdit: boolean;
  }>();

  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<BackordersReceptionsFormDialog>);
  readonly data = inject<ReceptionFormDialogData>(MAT_DIALOG_DATA);
  private readonly productsApi = inject(ProductsApiService);

  readonly isEdit = this.data.isEdit;
  readonly backOrders = this.data.BackOrder;
  readonly variants = signal<ProductVariant[]>([]);

  readonly isLoadingVariants = signal(false);
  readonly isSubmitting = signal(false);

  form!: FormGroup;
  errorFile = signal<string>('');

  ngOnInit(): void {
    //this.loadVariants();
    this.formBuilder();
    
  }

  onSubmit(): void {
    
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isEdit) {
      const updatePayload: ReceptionLineUpdateFormRequest = {
        receivedQuantity: this.getFormValue("receivedQuantity"),
        hasIncident: this.getFormValue("hasIncident"),
        incidentComments: this.getFormValue("incidentComments"),
        incidentQuantity: this.getFormValue("incidentQuantity"),
        lineComments: this.getFormValue("lineComments"),
      };
      const formData = new FormData();
      this.formDataMapping(formData, updatePayload);

      this.dialogRef.close(formData);
    } 
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSelectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    //this.imageErrorAfter = null;

    if (!file) {
      this.setFormValue('File', null);
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
      this.clearFile(input);
      return;
    }

    this.setFormValue('attachedFile', file, null);
    this.setFormValue('attachedFileName', file.name, null);
    //const reader = new FileReader();
    //reader.onload = () => (this.imagePreviewAfter = reader.result as string);
    //reader.readAsDataURL(file);
  }

  formDataMapping(formData: FormData, model: any): void {
    Object.keys(model).forEach((key: string) => {
      // Si es null, mandar cadena vacía (opcional)
      if (model[key] === null || model[key] === undefined) {
        formData.append(key, "");
        return;
      }

      // Si NO es Activities (lista), agregar normal
      if (key !== "destinationBranchIds") {
        formData.append(key, model[key].toString());
      }
    });

    //imagenes
    const imgFile = this.getFormValue("attachedFile");
    if (imgFile) {
      formData.append("attachedFile", imgFile, imgFile.name);
    }
  }

  formBuilder(): void {
    this.form = this.fb.group({
      receivedQuantity: [0, [Validators.required, Validators.min(0)]],
      incidentQuantity: [0, [Validators.min(0)]],
      hasIncident: [false],
      incidentComments: [''],
      lineComments: [''],
      attachedFile: [null]
    });
  }

  setcontrolsDisabled(): void {
    this.form.controls['branch'].disable();
    this.form.controls['branchId'].disable();
    this.form.controls['productVariantId'].disable();
  }

  getVariantDisplayName(variant: ProductVariant): string {
    const attrs = variant.description;
    return variant.sku ? `${attrs} (${variant.sku})` : attrs;
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }

  clearFile(fileInput?: HTMLInputElement): void {
    this.setFormValue('attachedFile', null);
    //this.imagePreviewAfter = null;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  getFormValue(value: any): any | null {
    return this.getFormElement(value).value;
  }

  getFormElement(value: any): any | null {
    return this.form.get(value);
  }

  setFormValue(name: string, data: any, emitEvent: any = {}) {
    this.getFormElement(name).setValue(data, emitEvent);
  }
}
