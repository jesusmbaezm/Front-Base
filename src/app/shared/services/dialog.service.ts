import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';

@Injectable({ providedIn: 'root' })
export class DialogService {
  constructor(private dialog: MatDialog) {}

  open<T>(component: ComponentType<T>, config?: {
    data?: any;
    width?: string;
    maxHeight?: string;
  }) {
    return this.dialog.open(component, {
      data: config?.data,
      width: config?.width ?? '560px',
      maxHeight: config?.maxHeight ?? '85vh',
      panelClass: 'demo-dialog-panel',
      disableClose: true,
      autoFocus: false,
    });
  }
}
