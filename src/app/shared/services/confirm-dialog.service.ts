import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../components/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly dialog = inject(MatDialog);

  confirm(data: ConfirmDialogData): Observable<boolean> {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data,
      width: '460px',
      panelClass: 'demo-dialog-panel',
      disableClose: true,
      autoFocus: false,
    });
    return ref.afterClosed().pipe(map((result) => result === true));
  }

  prompt(data: ConfirmDialogData & { showInput: true }): Observable<string | null> {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data,
      width: '460px',
      panelClass: 'demo-dialog-panel',
      disableClose: true,
      autoFocus: false,
    });
    return ref.afterClosed().pipe(
      map((result) => (result !== false && result !== undefined ? (result as string) : null))
    );
  }
}
