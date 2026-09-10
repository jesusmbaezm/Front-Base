import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';

import { ToastComponent, ToastData } from '../components/toast/toast.component';

const TOAST_DURATION = 4000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);
  private currentRef: MatSnackBarRef<ToastComponent> | null = null;
  private _dismissTimer: ReturnType<typeof setTimeout> | null = null;

  success(message: string, title: string = 'Operación exitosa'): void {
    this.show({ variant: 'success', title, message });
  }

  error(message: string, title: string = 'Error'): void {
    this.show({ variant: 'error', title, message });
  }

  warning(message: string, title: string = 'Atención'): void {
    this.show({ variant: 'warning', title, message });
  }

  info(message: string, title: string = 'Información'): void {
    this.show({ variant: 'info', title, message });
  }

  neutral(message: string, title: string): void {
    this.show({ variant: 'neutral', title, message });
  }

  loading(message: string, title: string = 'Procesando'): void {
    this.clearDismissTimer();
    if (this.currentRef) {
      this.currentRef.dismiss();
    }
    this.currentRef = this.snackBar.openFromComponent(ToastComponent, {
      data: { variant: 'loading', title, message } as any,
      duration: 0,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: 'demo-toast-panel',
    });
    this.currentRef.afterDismissed().subscribe(() => {
      this.currentRef = null;
    });
  }

  dismiss(): void {
    this.clearDismissTimer();
    this.currentRef?.dismiss();
  }

  private show(data: ToastData): void {
    if (this.currentRef) {
      this.currentRef.dismiss();
      this.currentRef.afterDismissed().subscribe(() => this.open(data));
    } else {
      this.open(data);
    }
  }

  private open(data: ToastData): void {
    this.currentRef = this.snackBar.openFromComponent(ToastComponent, {
      data: {
        ...data,
        onMouseEnter: () => this.pauseDismissTimer(),
        onMouseLeave: () => this.startDismissTimer(),
      },
      duration: 0,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: 'demo-toast-panel',
    });
    this.startDismissTimer();
    this.currentRef.afterDismissed().subscribe(() => {
      this.currentRef = null;
      this.clearDismissTimer();
    });
  }

  private startDismissTimer(): void {
    this.clearDismissTimer();
    this._dismissTimer = setTimeout(() => this.currentRef?.dismiss(), TOAST_DURATION);
  }

  private pauseDismissTimer(): void {
    this.clearDismissTimer();
  }

  private clearDismissTimer(): void {
    if (this._dismissTimer) {
      clearTimeout(this._dismissTimer);
      this._dismissTimer = null;
    }
  }
}
