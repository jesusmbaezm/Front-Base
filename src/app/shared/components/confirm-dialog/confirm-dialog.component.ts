import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export type ConfirmDialogVariant = 'danger' | 'success' | 'warning' | 'primary';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  showInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputRequired?: boolean;
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {
  inputValue = '';

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  get variant(): ConfirmDialogVariant {
    return this.data.variant ?? 'danger';
  }

  get confirmText(): string {
    return this.data.confirmText ?? 'Confirmar';
  }

  get cancelText(): string {
    return this.data.cancelText ?? 'Cancelar';
  }

  get canConfirm(): boolean {
    if (this.data.showInput && this.data.inputRequired) {
      return this.inputValue.trim().length > 0;
    }
    return true;
  }

  onConfirm(): void {
    if (!this.canConfirm) return;
    this.dialogRef.close(this.data.showInput ? this.inputValue.trim() : true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
