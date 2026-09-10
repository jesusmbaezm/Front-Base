import { Component, inject, signal, output, input, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, takeUntil, tap } from 'rxjs';

import { ProductLookupService } from '@app/core/security/product-lookup.service';
import { ProductLookupItem } from '@app/core/models/quotation.model';
import { ToastService } from '@app/shared/services/toast.service';
import { BadgeComponent } from '@app/shared/components/badge/badge.component';

@Component({
  selector: 'app-product-lookup',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatIconModule,
    BadgeComponent,
  ],
  template: `
    <div class="lookup-wrapper">
      @if (!branchId()) {
        <div class="no-branch-overlay" [title]="noSelectionText()"></div>
      }
    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="full-width"
      [class.lookup-no-branch]="!branchId()">
      <mat-label>{{ label() }}</mat-label>
      <input
        matInput
        [value]="searchTerm()"
        (input)="onSearchTermChange($any($event.target).value)"
        [placeholder]="branchId() ? 'Escriba para buscar...' : noSelectionText()"
        [matAutocomplete]="auto"
      />
      <mat-icon matSuffix>search</mat-icon>
      <mat-autocomplete
        #auto="matAutocomplete"
        (optionSelected)="onProductSelected($event.option.value)"
        [displayWith]="displayFn"
        class="product-autocomplete"
      >
        @if (isSearching()) {
          <mat-option disabled>
            <mat-spinner diameter="20"></mat-spinner>
            Buscando...
          </mat-option>
        }
        @for (item of products(); track item.variantId) {
          <mat-option [value]="item" class="product-option-item">
            <div class="product-card">
              <div class="product-card-top">
                <span class="sku-chip">{{ item.sku }}</span>
                <span class="product-name">{{ item.productName }}</span>
                @if (!item.isActive) {
                  <app-badge variant="neutral" label="Inactivo" size="xs" />
                }
                <span class="spacer"></span>
                @if (showPrice()) {
                  @if (item.price > 0) {
                    <span class="price-val">{{ item.price | currency }}</span>
                  } @else {
                    <span class="no-price-tag">Sin precio</span>
                  }
                }
              </div>
              <div class="product-card-bottom">
                @if (item.categoryDisplay) {
                  <span class="meta-tag cat-tag">{{ item.categoryDisplay }}</span>
                }
                @if (item.variantDescription) {
                  <span class="meta-tag var-tag">{{ item.variantDescription }}</span>
                }
                <span class="spacer"></span>
                @if (showStock()) {
                  <span class="stock-chip" [class]="getStockClass(item.stock)">
                    <mat-icon>inventory_2</mat-icon>
                    {{ item.stock }}
                  </span>
                }
              </div>
            </div>
          </mat-option>
        }
        @if (!isSearching() && products().length === 0 && searchTerm().length >= 2) {
          <mat-option disabled>No se encontraron resultados</mat-option>
        }
      </mat-autocomplete>
    </mat-form-field>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .lookup-wrapper {
        position: relative;
      }

      .no-branch-overlay {
        position: absolute;
        inset: 0;
        z-index: 2;
        cursor: not-allowed;
      }

      .full-width {
        width: 100%;
        --mat-form-field-container-height: 40px;
        --mdc-outlined-text-field-container-shape: 8px;
      }

      .lookup-no-branch {
        opacity: 0.45;
      }

      .full-width ::ng-deep .mat-mdc-form-field-infix { padding-top: 8px !important; padding-bottom: 8px !important; min-height: unset !important; }
      .full-width ::ng-deep .mat-mdc-text-field-wrapper { padding: 0 12px !important; }
      .full-width ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none !important; }

      ::ng-deep .product-autocomplete .mat-mdc-option {
        height: auto !important;
        padding: 0 !important;
        border-bottom: 0.5px solid #f0f0f0;
        border-left: 3px solid #2F4499 !important;
        background: #fff !important;
      }

      ::ng-deep .product-autocomplete .mat-mdc-option:last-child {
        border-bottom: none;
      }

      ::ng-deep .product-autocomplete .mat-mdc-option.mdc-list-item--selected,
      ::ng-deep .product-autocomplete .mat-mdc-option:hover {
        background: #f5f7ff !important;
      }

      ::ng-deep .product-autocomplete .mat-mdc-option.mdc-list-item--disabled {
        padding: 8px 12px !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      }

      ::ng-deep .product-autocomplete .mdc-list-item__primary-text {
        width: 100%;
      }

      .product-card {
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 100%;
        padding: 6px 10px;
      }

      .product-card-top {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .product-card-bottom {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }

      .sku-chip {
        font-size: 10px;
        font-weight: 700;
        color: #fff;
        background: #2F4499;
        padding: 2px 7px;
        border-radius: 4px;
        letter-spacing: 0.4px;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .product-name {
        font-size: 13px;
        font-weight: 600;
        color: #111827;
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .meta-tag {
        font-size: 10px;
        font-weight: 500;
        padding: 1px 6px;
        border-radius: 4px;
        white-space: nowrap;
      }

      .cat-tag {
        background: #EFF3FF;
        color: #2F4499;
      }

      .var-tag {
        background: #F3F4F6;
        color: #4B5563;
      }

      .spacer {
        flex: 1;
      }

      .price-val {
        font-size: 12px;
        font-weight: 600;
        color: #059669;
        white-space: nowrap;
      }

      .no-price-tag {
        font-size: 10px;
        font-weight: 600;
        padding: 1px 6px;
        border-radius: 4px;
        background: #FEE2E2;
        color: #991B1B;
        white-space: nowrap;
      }

      .stock-chip {
        display: flex;
        align-items: center;
        gap: 3px;
        font-size: 11px;
        font-weight: 600;
        padding: 1px 6px;
        border-radius: 4px;
        white-space: nowrap;

        mat-icon {
          font-size: 12px;
          width: 12px;
          height: 12px;
        }
      }

      .stock-ok {
        background: #D1FAE5;
        color: #065F46;
      }

      .stock-low {
        background: #FEF3C7;
        color: #92400E;
      }

      .stock-none {
        background: #FEE2E2;
        color: #991B1B;
      }
    `,
  ],
})
export class ProductLookupComponent implements OnDestroy {
  private readonly productLookupService = inject(ProductLookupService);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  readonly label = input<string>('Buscar producto');
  readonly SupplierId = input<number | undefined>();
  readonly branchId = input<number | null>(null);
  readonly showStock = input<boolean>(true);
  readonly showPrice = input<boolean>(true);
  readonly noSelectionText = input<string>('Selecciona una sucursal primero');
  readonly productSelected = output<ProductLookupItem>();

  readonly searchTerm = signal('');
  readonly products = signal<ProductLookupItem[]>([]);
  readonly isSearching = signal(false);
  readonly selectedProduct = signal<ProductLookupItem | null>(null);

  setProduct(product: ProductLookupItem): void {
    this.selectedProduct.set(product);
    this.searchTerm.set(product.productName);
    this.products.set([]);
  }

  clearSelection(): void {
    this.selectedProduct.set(null);
    this.searchTerm.set('');
    this.products.set([]);
  }

  getStockClass(stock: number): string {
    if (stock <= 0) return 'stock-chip stock-none';
    if (stock <= 5) return 'stock-chip stock-low';
    return 'stock-chip stock-ok';
  }

  constructor() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((term) => {
          if (term.length < 2) {
            this.products.set([]);
            this.isSearching.set(false);
          } else {
            this.isSearching.set(true);
          }
        }),
        switchMap((term) => {
          if (term.length < 2 || !this.branchId()) return EMPTY;
          return this.productLookupService
            .lookup(term, this.SupplierId(), this.branchId() ?? undefined)
            .pipe(
              catchError(() => {
                this.toast.error('No se pudo buscar productos', 'Error');
                return of({ data: [] as ProductLookupItem[] });
              }),
            );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((response) => {
        this.products.set(response.data);
        this.isSearching.set(false);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchTermChange(term: string): void {
    if (!this.branchId()) return;
    this.searchTerm.set(term);
    this.searchSubject.next(term);
  }

  onProductSelected(item: ProductLookupItem): void {
    this.searchTerm.set(item.productName);
    this.productSelected.emit(item);
    this.products.set([]);
  }

  displayFn(item: ProductLookupItem): string {
    return item?.productName ?? '';
  }
}
