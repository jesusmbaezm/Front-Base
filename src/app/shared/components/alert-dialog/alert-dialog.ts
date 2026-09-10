import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface AlertDialogData {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  confirmText?: string;
  showCancel?: boolean;
}

@Component({
  selector: 'app-alert-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="alert-dialog" [class]="'alert-dialog--' + data.type">
      <div class="alert-dialog__icon">
        @switch (data.type) {
          @case ('success') {
            <mat-icon>check_circle</mat-icon>
          }
          @case ('error') {
            <mat-icon>error</mat-icon>
          }
          @case ('warning') {
            <mat-icon>warning</mat-icon>
          }
          @case ('info') {
            <mat-icon>info</mat-icon>
          }
        }
      </div>
      
      <h2 mat-dialog-title>{{ data.title }}</h2>
      
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      
      <mat-dialog-actions align="center">
        @if (isLoading()) {
          <mat-spinner diameter="30"></mat-spinner>
        } @else {
          @if (data.showCancel) {
            <button mat-button (click)="onCancel()">
              Cancelar
            </button>
          }
          <button 
            mat-flat-button 
            [color]="getButtonColor()" 
            (click)="onConfirm()">
            {{ data.confirmText || 'Aceptar' }}
          </button>
        }
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .alert-dialog {
      padding: 8px;
      min-width: 320px;
      text-align: center;
    }

    .alert-dialog__icon {
      margin-bottom: 12px;
    }

    .alert-dialog__icon mat-icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
    }

    .alert-dialog--success .alert-dialog__icon mat-icon {
      color: #16a34a;
    }

    .alert-dialog--error .alert-dialog__icon mat-icon {
      color: #dc2626;
    }

    .alert-dialog--warning .alert-dialog__icon mat-icon {
      color: #f59e0b;
    }

    .alert-dialog--info .alert-dialog__icon mat-icon {
      color: #2563eb;
    }

    .alert-dialog h2 {
      margin: 0 0 8px;
      font-size: 20px;
      font-weight: 600;
    }

    .alert-dialog p {
      margin: 0;
      color: #64748b;
      font-size: 14px;
    }

    .alert-dialog mat-dialog-actions {
      margin-top: 24px;
      gap: 12px;
      justify-content: center;
    }
  `]
})
export class AlertDialog {
  readonly dialogRef = inject(MatDialogRef<AlertDialog>);
  readonly data = inject<AlertDialogData>(MAT_DIALOG_DATA);

  readonly isLoading = signal(false);

  getButtonColor(): string {
    switch (this.data.type) {
      case 'success': return 'primary';
      case 'error': return 'warn';
      case 'warning': return 'accent';
      default: return 'primary';
    }
  }

  setLoading(loading: boolean): void {
    this.isLoading.set(loading);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
