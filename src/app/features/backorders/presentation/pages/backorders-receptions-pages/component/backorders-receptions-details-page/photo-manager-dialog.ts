import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

export interface PhotoManagerDialogData {
  files: File[];
}

interface FileEntry {
  file: File;
  preview: SafeUrl | null;
  objectUrl: string | null;
}

@Component({
  selector: 'app-photo-manager-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatTooltipModule],
  template: `
    <div class="modal-wrapper">

      <div class="modal-header">
        <div class="modal-title">Evidencia fotográfica</div>
        <button class="modal-close" type="button" (click)="cancel()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        @if (entries.length === 0) {
          <div class="pm-empty">
            <span class="material-symbols-outlined pm-empty-icon">photo_library</span>
            <span>Sin archivos adjuntos</span>
          </div>
        } @else {
          <div class="pm-grid">
            @for (entry of entries; track $index; let i = $index) {
              <div class="pm-tile" [matTooltip]="entry.file.name" matTooltipPosition="above">
                @if (entry.preview) {
                  <img class="pm-tile-img" [src]="entry.preview" [alt]="entry.file.name" />
                } @else {
                  <div class="pm-tile-file">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                }
                <button class="pm-tile-remove" (click)="remove(i)">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
            }
          </div>
          @if (entries.length >= maxFiles) {
            <p class="pm-limit-hint">Máximo {{ maxFiles }} archivos alcanzado.</p>
          }
        }
      </div>

      <div class="modal-footer">
        <label class="btn-ghost-footer" [class.disabled]="entries.length >= maxFiles">
          <span class="material-symbols-outlined btn-icon">add_photo_alternate</span>
          Agregar fotos
          <input type="file" hidden multiple accept="image/*,.pdf" [disabled]="entries.length >= maxFiles" (change)="onAdd($event)" />
        </label>
        <button class="btn-primary-footer" (click)="save()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M4.5 12.75l6 6 9-13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Listo ({{ entries.length }})
        </button>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; width: 480px; max-height: 80vh; }

    .modal-body { min-height: 100px; }

    .modal-footer { justify-content: space-between; }

    .pm-empty {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 8px; padding: 40px 0; color: #9ca3af;
      span { font-size: 13px; }
    }

    .pm-empty-icon { font-size: 40px !important; }
    .btn-icon { font-size: 18px !important; line-height: 1; }

    .pm-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
    }

    .pm-tile {
      position: relative;
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      background: #f3f4f6;
    }

    .pm-tile-img {
      width: 100%; height: 100%;
      object-fit: cover; display: block;
    }

    .pm-tile-file {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      color: #9ca3af;
    }

    .pm-tile-remove {
      position: absolute; top: 4px; right: 4px;
      width: 20px; height: 20px; border-radius: 50%;
      border: none; background: rgba(0,0,0,0.55); color: #fff;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      &:hover { background: rgba(0,0,0,0.75); }
    }

    .pm-limit-hint {
      font-size: 11px; color: #D97706; margin: 8px 0 0; text-align: center;
    }

    .btn-ghost-footer {
      display: inline-flex; align-items: center; gap: 6px;
      height: 36px; padding: 0 14px; border-radius: 8px;
      border: 1px solid #E5E7EB; background: #fff; box-sizing: border-box;
      font-size: 13px; font-weight: 500; color: #374151;
      cursor: pointer; font-family: inherit;
      &:hover { background: #F9FAFB; }
      &.disabled { opacity: 0.45; cursor: not-allowed; pointer-events: none; }
    }

    .btn-primary-footer {
      display: inline-flex; align-items: center; gap: 6px;
      height: 36px; padding: 0 18px; border-radius: 8px; box-sizing: border-box;
      border: none; background: #2F4499; color: #fff;
      font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit;
      &:hover { background: #1C2B5E; }
    }
  `]
})
export class PhotoManagerDialogComponent implements OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<PhotoManagerDialogComponent>);
  private readonly data = inject<PhotoManagerDialogData>(MAT_DIALOG_DATA);
  private readonly sanitizer = inject(DomSanitizer);

  readonly maxFiles = 10;
  entries: FileEntry[] = [];

  constructor() {
    this.entries = this.data.files.map(f => this.buildEntry(f));
  }

  private buildEntry(file: File): FileEntry {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      return { file, objectUrl: url, preview: this.sanitizer.bypassSecurityTrustUrl(url) };
    }
    return { file, objectUrl: null, preview: null };
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  remove(index: number): void {
    const entry = this.entries[index];
    if (entry.objectUrl) URL.revokeObjectURL(entry.objectUrl);
    this.entries.splice(index, 1);
  }

  onAdd(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newFiles = Array.from(input.files ?? []);
    input.value = '';
    const slots = this.maxFiles - this.entries.length;
    newFiles.slice(0, slots).forEach(f => this.entries.push(this.buildEntry(f)));
  }

  save(): void {
    this.dialogRef.close(this.entries.map(e => e.file));
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  ngOnDestroy(): void {
    this.entries.forEach(e => { if (e.objectUrl) URL.revokeObjectURL(e.objectUrl); });
  }
}
