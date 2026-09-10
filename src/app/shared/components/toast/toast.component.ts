import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule, MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'loading';

export interface ToastData {
  title: string;
  message: string;
  variant: ToastVariant;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
})
export class ToastComponent {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: ToastData,
    private snackBarRef: MatSnackBarRef<ToastComponent>
  ) {}

  close(): void {
    this.snackBarRef.dismiss();
  }
}
