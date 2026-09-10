import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component.hasUnsavedChanges()) return true;

  const confirmDialog = inject(ConfirmDialogService);
  return confirmDialog.confirm({
    variant: 'warning',
    title: 'Cambios sin guardar',
    message: 'Tienes cambios que aún no se han guardado. ¿Deseas salir sin guardar?',
    confirmText: 'Salir sin guardar',
  });
};
