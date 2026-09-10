import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ShipmentLineCreateDto } from '@app/core/models/backorders-shipments.model';
import { Branch } from '@app/core/models/branch.models';
import { ProductVariant } from '@app/core/models/product-variant.model';
import { ProductLookupItem } from '@app/core/models/quotation.model';
import { ProductsApiService } from '@app/core/security/products-api.service';
import { AlertService } from '@app/shared/components/alert-dialog/alert.service';
import { ProductLookupComponent } from '@app/shared/components/product-lookup/product-lookup.component';

export interface LineFormDialogData {
  line?: ShipmentLineCreateDto;
  isEdit: boolean;
}

@Component({
  selector: 'app-backorders-shipments-lines-form-dialog',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ProductLookupComponent,
  ],
  templateUrl: './backorders-shipments-lines-form-dialog.html',
  styleUrl: './backorders-shipments-lines-form-dialog.scss',
})
export class BackordersShipmentsLinesFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<BackordersShipmentsLinesFormDialog>);
  readonly data = inject<LineFormDialogData>(MAT_DIALOG_DATA);
  //private readonly branchesApi = inject(BranchesApiService);
  private readonly alertService = inject(AlertService);
  private readonly productsApi = inject(ProductsApiService);
  
  readonly isEdit = this.data.isEdit;
  readonly variants = signal<ProductVariant[]>([]);

  readonly isLoadingVariants = signal(false);

  readonly isSubmitting = signal(false);
  readonly ListBranches = signal<Branch[]>([]);
  readonly isLoading = signal(false);
  
  form!: FormGroup;

  ngOnInit(): void {
    
    if(this.data.isEdit){
      this.formBuilderUpdate(this.data.line);
    } else {
      this.formBuilder();
    }
    this.loadVariants();
    
    this.isLoading.set(true);
  }

  onSubmit(): void {
    
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    const formValue = this.form.value;

      const updatePayload = {
        destinationBranchId: this.data.line?.destinationBranchId,
        productVariantId: Number(this.getFormValue('productVariantId')),
        quantity: Number(this.getFormValue('Quantity')),
        lineComments: this.getFormValue('LineComments')
      } as ShipmentLineCreateDto;
      this.dialogRef.close(updatePayload);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onProductSelected(product: ProductLookupItem): void {
      this.setFormValue('productVariantId', product.variantId);
    }

  private loadVariants(): void {
    this.isLoadingVariants.set(true);
    this.productsApi.getAllVariants().subscribe({
      next: (response) => {
        this.variants.set(response.data);
        this.isLoadingVariants.set(false);
      },
      error: (err) => {
        console.error('[EntryFormDialog] loadVariants()', err);
        this.isLoadingVariants.set(false);
      },
    });
  }

  getVariantDisplayName(variant: ProductVariant): string {
    const attrs = variant.productName + " - " + variant.description;
    return variant.sku ? `${attrs} (${variant.sku})` : attrs;
  }

  formBuilder(): void {
    this.form = this.fb.group({
      productVariantId: ['', [Validators.required]],
      Quantity: ['', [Validators.required]],
      LineComments: ['',[Validators.minLength(3), Validators.maxLength(500)] ]
    });
  }

  formBuilderUpdate(line?: ShipmentLineCreateDto): void {
    this.form = this.fb.group({
      productVariantId: [{value: line?.productVariantId, disabled: true }],
      Quantity: [line?.quantity, [Validators.required]],
      LineComments: [line?.lineComments,[Validators.minLength(3), Validators.maxLength(500)] ]
    });
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
