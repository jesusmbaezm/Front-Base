// src/app/bootstrap/material/material-defaults.ts
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { Provider } from '@angular/core';

export const materialDefaults: Provider[] = [
  { provide: MAT_DATE_LOCALE, useValue: 'es-MX' },
  {
    provide: MAT_DIALOG_DEFAULT_OPTIONS,
    useValue: {
      hasBackdrop: true,
      disableClose: true,
      minWidth: '320px'
    }
  },
  {
    provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
    useValue: {
      duration: 4000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    }
  }
];