import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { BackOrdersShipmentsApiService } from '@app/core/security/backorders-shipments.service';
import { ShipmentVariantSearchResult } from '@app/core/models/backorders-shipments.model';

export interface AddLineDialogData {
  shipmentId: number;
  originBranchId?: number;
  branchName: string;
  excludeVariantIds: number[];
}

export interface AddLineResult {
  productVariantId: number;
  productName: string;
  variantDescription: string;
  sku: string;
  originAvailableStock: number;
  quantity: number;
}

interface SearchRow extends ShipmentVariantSearchResult {
  quantity: number;
  selected: boolean;
}

@Component({
  selector: 'app-shipment-add-line-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './shipment-add-line-dialog.html',
  styleUrl: './shipment-add-line-dialog.scss',
})
export class ShipmentAddLineDialog implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<ShipmentAddLineDialog>);
  readonly data = inject<AddLineDialogData>(MAT_DIALOG_DATA);
  private readonly shipmentsApi = inject(BackOrdersShipmentsApiService);

  readonly isLoading = signal(false);
  readonly rows = signal<SearchRow[]>([]);
  searchTerm = '';

  private readonly search$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  get selectedCount(): number {
    return this.rows().filter(r => r.selected).length;
  }

  get hasError(): boolean {
    return this.rows().some(r => r.selected && (r.quantity < 1 || r.quantity > r.originAvailableStock));
  }

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => this.doSearch(term));

    this.doSearch('');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(): void {
    this.search$.next(this.searchTerm);
  }

  rowHasError(row: SearchRow): boolean {
    return row.selected && (row.quantity < 1 || row.quantity > row.originAvailableStock);
  }

  private doSearch(term: string): void {
    this.isLoading.set(true);
    this.shipmentsApi.searchOriginVariants(this.data.shipmentId, term, this.data.originBranchId).subscribe({
      next: (res) => {
        const excluded = new Set(this.data.excludeVariantIds);
        const prev = new Map(this.rows().map(r => [r.productVariantId, r]));
        this.rows.set(
          (res.data ?? [])
            .filter(v => !excluded.has(v.productVariantId))
            .map(v => {
              const existing = prev.get(v.productVariantId);
              return {
                ...v,
                quantity: existing?.quantity ?? 1,
                selected: existing?.selected ?? false,
              };
            })
        );
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onSubmit(): void {
    const selected = this.rows()
      .filter(r => r.selected)
      .map(r => ({
        productVariantId: r.productVariantId,
        productName: r.productName,
        variantDescription: r.variantDescription,
        sku: r.sku,
        originAvailableStock: r.originAvailableStock,
        quantity: r.quantity,
      } as AddLineResult));
    this.dialogRef.close(selected);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
