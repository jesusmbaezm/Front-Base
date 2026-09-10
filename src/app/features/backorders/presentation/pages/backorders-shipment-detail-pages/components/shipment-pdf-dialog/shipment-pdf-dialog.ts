import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BackOrdersShipmentsApiService } from '@app/core/security/backorders-shipments.service';

export interface ShipmentPdfDialogData {
  shipmentId: number;
  folio: string;
}

@Component({
  selector: 'app-shipment-pdf-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="pdf-dialog">
      <div class="pdf-dialog__header">
        <h2>Embarque {{ data.folio }}</h2>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="pdf-dialog__content">
        @if (isLoading()) {
          <div class="pdf-dialog__loading">
            <mat-spinner diameter="48"></mat-spinner>
            <p>Cargando documento...</p>
          </div>
        } @else if (error()) {
          <div class="pdf-dialog__error">
            <mat-icon>error_outline</mat-icon>
            <p>{{ error() }}</p>
            <button mat-flat-button color="primary" (click)="loadPdf()">Reintentar</button>
          </div>
        } @else if (safePdfUrl()) {
          <iframe [src]="safePdfUrl()" class="pdf-viewer" type="application/pdf"></iframe>
        }
      </div>

      <div class="pdf-dialog__actions">
        <button mat-flat-button color="primary" (click)="download()" [disabled]="!safePdfUrl()">
          <mat-icon>download</mat-icon>
          Descargar
        </button>
        <button mat-button (click)="close()">Cerrar</button>
      </div>
    </div>
  `,
  styles: [`
    .pdf-dialog { display: flex; flex-direction: column; height: 80vh; width: 100%; }
    .pdf-dialog__header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 20px; border-bottom: 0.5px solid #e5e5e5;
      h2 { margin: 0; font-size: 16px; font-weight: 600; color: #1a1a2e; }
    }
    .pdf-dialog__content {
      flex: 1; display: flex; justify-content: center; align-items: center;
      background: #f1f5f9; overflow: hidden;
    }
    .pdf-dialog__loading, .pdf-dialog__error {
      display: flex; flex-direction: column; align-items: center; gap: 16px; color: #64748b;
      p { margin: 0; font-size: 14px; }
    }
    .pdf-dialog__error mat-icon { font-size: 48px; width: 48px; height: 48px; color: #dc2626; }
    .pdf-viewer { width: 100%; height: 100%; border: none; }
    .pdf-dialog__actions {
      display: flex; justify-content: flex-end; gap: 8px;
      padding: 12px 20px; border-top: 0.5px solid #e5e5e5;
    }
  `],
})
export class ShipmentPdfDialog implements OnInit, OnDestroy {
  readonly dialogRef = inject(MatDialogRef<ShipmentPdfDialog>);
  readonly data = inject<ShipmentPdfDialogData>(MAT_DIALOG_DATA);
  private readonly shipmentsApi = inject(BackOrdersShipmentsApiService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly safePdfUrl = signal<SafeResourceUrl | null>(null);

  private blobUrl: string | null = null;

  ngOnInit(): void {
    this.loadPdf();
  }

  ngOnDestroy(): void {
    if (this.blobUrl) {
      window.URL.revokeObjectURL(this.blobUrl);
    }
  }

  loadPdf(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.shipmentsApi.downloadPdf(this.data.shipmentId).subscribe({
      next: (blob) => {
        if (this.blobUrl) window.URL.revokeObjectURL(this.blobUrl);
        this.blobUrl = window.URL.createObjectURL(blob);
        this.safePdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl));
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[ShipmentPdfDialog] loadPdf()', err);
        this.error.set('No se pudo cargar el documento');
        this.isLoading.set(false);
      },
    });
  }

  download(): void {
    if (!this.blobUrl) return;
    const link = document.createElement('a');
    link.href = this.blobUrl;
    link.download = `embarque-${this.data.folio}.pdf`;
    link.click();
  }

  close(): void {
    this.dialogRef.close();
  }
}
