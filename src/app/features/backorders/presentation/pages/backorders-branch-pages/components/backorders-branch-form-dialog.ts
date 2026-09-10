import { Component, EventEmitter, inject, OnDestroy, OnInit, Output, signal, ViewChild } from '@angular/core';
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
import { ModalFooterComponent } from '@app/shared/components/modal-footer/modal-footer.component';

import {
  BackorderItemDto,
  BackorderItemCreateDto,
  BackorderItemUpdateDto,
} from '@app/core/models/backorders.model';
import { ProductsApiService } from '@app/core/security/products-api.service';
import { ProductVariant } from '@app/core/models/product-variant.model';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ProductLookupItem, ProductSearchResult } from '@app/core/models/quotation.model';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { QuotationsApiService } from '@app/core/security/quotations-api.service';
import { ProductLookupComponent } from '@app/shared/components/product-lookup/product-lookup.component';
import { AuthUser } from '../backorders-branch-pages';
import { BranchesApiService } from '@app/core/security/branches-api.service';
import { Branch } from '@app/core/models/branch.models';
import { BranchSelectComponent } from '@app/shared/components/branch-select/branch-select.component';

export interface BackOrdersFormDialogData {
    BackOrder?: BackorderItemDto;
    isEdit: boolean;
}

@Component({
  selector: 'app-backorders-branch-form-dialog',
  standalone: true,
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
    MatAutocompleteModule,
    ProductLookupComponent,
    BranchSelectComponent,
    ModalFooterComponent,
  ],
  templateUrl: './backorders-branch-form-dialog.html',
  styleUrl: './backorders-branch-form-dialog.scss',
})
export class BackOrdersFormDialog implements OnInit, OnDestroy {
  @Output() submitForm = new EventEmitter<{
    data: BackorderItemCreateDto | BackorderItemUpdateDto;
    isEdit: boolean;
  }>();

  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<BackOrdersFormDialog>);
  readonly data = inject<BackOrdersFormDialogData>(MAT_DIALOG_DATA);
  private readonly productsApi = inject(ProductsApiService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly quotationsApi = inject(QuotationsApiService);
  @ViewChild(ProductLookupComponent) productLookup!: ProductLookupComponent;
  private readonly destroy$ = new Subject<void>();

  
  readonly backOrders = this.data.BackOrder;
  readonly variants = signal<ProductVariant[]>([]);
  readonly productSuggestions = signal<ProductSearchResult[]>([]);
  private readonly searchSubject = new Subject<string>();
  readonly isSearchingProducts = signal(false);
  readonly branches = signal<Branch[]>([]);

  readonly isEdit = this.data.isEdit;
  readonly isLoadingVariants = signal(false);
  readonly isSubmitting = signal(false);

  form!: FormGroup;
   

  ngOnInit(): void {
    this.loadBranches();
    this.formBuilder();
    if(this.data.isEdit) {
      this.setcontrolsDisabled();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isEdit) {
      const updatePayload: BackorderItemUpdateDto = {
        quantity: this.getFormValue("Quantity"),
      };

      this.submitForm.emit({ data: updatePayload, isEdit: true });
    } else {
      const createPayload: BackorderItemCreateDto = {
        branchId: this.getFormValue("branchId"),
        productVariantId: this.getFormValue("productVariantId"),
        quantity: this.getFormValue("Quantity"),
      };

      this.submitForm.emit({ data: createPayload, isEdit: false });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onProductSelected(product: ProductLookupItem): void {
    this.setFormValue('productVariantId', product.variantId, {});
  }

  loadBranches(): void {
    let user: AuthUser = JSON.parse(localStorage.getItem("user") || "");
    let branchUser = user.branches.map(m => m.id);
    const allowedIds = new Set(branchUser);
    this.branchesApi.getUserBranches().subscribe({
      next: (response) =>{
        this.branches.set(response.data.filter(d => allowedIds.has(d.id)));
      },
      error: (err) => console.error('[InventoryBalancesPage] loadBranches()', err),
    });
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

  formBuilder(): void {
    this.form = this.fb.group({
      branchId: [this.data.BackOrder?.branchId ?? null, [Validators.required]],
      productVariantId: [this.data.BackOrder?.productVariantId ?? null, [Validators.required]],
      Quantity: [this.data.BackOrder?.quantity ?? null, [Validators.required, Validators.min(1)]],
      searchTerm: ['']
    });
  }

  onQuantityKeydown(event: KeyboardEvent): void {
    if (event.key === '.' || event.key === ',' || event.key === '-' || event.key === 'e') {
      event.preventDefault();
    }
  }

  setcontrolsDisabled(): void {
    this.form.controls['branch'].disable();
    this.form.controls['branchId'].disable();
    this.form.controls['productVariantId'].disable();
  }

  getVariantDisplayName(variant: ProductVariant): string {
    const attrs = variant.productName + " - " + variant.description;
    return variant.sku ? `${attrs} (${variant.sku})` : attrs;
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
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