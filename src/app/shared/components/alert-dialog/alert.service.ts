import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import { AlertDialog, AlertDialogData } from './alert-dialog';
import { PromptDialog, PromptDialogData } from './prompt-dialog';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private readonly dialog = inject(MatDialog);

  success(title: string, message: string): MatDialogRef<AlertDialog> {
    return this.dialog.open(AlertDialog, {
      data: { title, message, type: 'success' },
      disableClose: true
    });
  }

  error(title: string, message: string): MatDialogRef<AlertDialog> {
    return this.dialog.open(AlertDialog, {
      data: { title, message, type: 'error' },
      disableClose: true
    });
  }

  warning(title: string, message: string): MatDialogRef<AlertDialog> {
    return this.dialog.open(AlertDialog, {
      data: { title, message, type: 'warning' },
      disableClose: true
    });
  }

  info(title: string, message: string): MatDialogRef<AlertDialog> {
    return this.dialog.open(AlertDialog, {
      data: { title, message, type: 'info' },
      disableClose: true
    });
  }

  confirm(
    title: string, 
    message: string, 
    confirmText: string = 'Confirmar'
  ): Observable<boolean> {
    const dialogRef = this.dialog.open(AlertDialog, {
      data: { title, message, type: 'warning', confirmText, showCancel: true },
      disableClose: true
    });

    return dialogRef.afterClosed();
  }

  prompt(
    title: string,
    message: string,
    placeholder: string = 'Ingrese el valor',
    confirmText: string = 'Aceptar'
  ): Observable<string | null> {
    const dialogRef = this.dialog.open(PromptDialog, {
      data: { title, message, placeholder, confirmText },
      disableClose: true
    });

    return dialogRef.afterClosed();
  }
}
