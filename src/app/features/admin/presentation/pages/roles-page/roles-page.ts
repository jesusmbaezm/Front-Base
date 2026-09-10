import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { ButtonComponent } from '@app/shared/components/button/button.component';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { RolesApiService } from '@app/core/security/roles-api.service';
import { AlertService } from '@app/shared/components/alert-dialog/alert.service';
import { ToastService } from '@app/shared/services/toast.service';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { Role, CreateRoleRequest, UpdateRoleRequest } from '@app/core/models/role.model';
import { RoleFormDialog } from './components/role-form-dialog';
import { HasPermissionDirective } from '@app/core/directives/has-permission.directive';
import { PERMISSIONS } from '@app/core/security/permissions';

@Component({
  selector: 'app-roles-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    ButtonComponent,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    HasPermissionDirective,
  ],
  templateUrl: './roles-page.html',
  styleUrl: './roles-page.scss'
})
export class RolesPage implements OnInit {
  protected readonly Permissions = PERMISSIONS;
  private readonly rolesApi = inject(RolesApiService);
  private readonly dialog = inject(MatDialog);
  private readonly alertService = inject(AlertService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly displayedColumns = ['role', 'description', 'permissions', 'actions'];

  readonly roles = signal<Role[]>([]);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.isLoading.set(true);

    this.rolesApi.getRoles().subscribe({
      next: (response) => {
        this.roles.set(response.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.log('[RolesPage] loadRoles()', err);
        // this.isLoading.set(false);
        // this.alertService.error('Error', 'Error al cargar roles');
      }
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(RoleFormDialog, {
      panelClass: 'demo-dialog-panel',
      width: '680px',
      maxHeight: '85vh',
      disableClose: true,
      data: { isEdit: false }
    });

    // dialogRef.afterClosed().subscribe((result) => {
    //   if (result?.error) {
    //     this.alertService.error('Error', result.error);
    //     return;
    //   }
    //   if (result) {
    const component = dialogRef.componentInstance;
    component.submitForm.subscribe((result) => {

      const request$ = this.rolesApi.createRole(result.data as CreateRoleRequest);
      request$.subscribe({
        next: (response) => {
          component.setSubmitting(false);
          dialogRef.close();
          this.toast.success(
            response.message || 'Rol creado exitosamente',
            'Éxito'
          );
          this.loadRoles();
        },
        error: (err) => {
          component.setSubmitting(false);
          const message = err.error?.message || 'Error al crear rol';
          console.error('[RolesPage] createRole()', err);
          this.toast.error(message, 'Error');
        }
      });
      //   }
    });
  }

  openEditDialog(role: Role): void {
    const dialogRef = this.dialog.open(RoleFormDialog, {
      panelClass: 'demo-dialog-panel',
      width: '680px',
      maxHeight: '85vh',
      disableClose: true,
      data: { role, isEdit: true }
    });

    // dialogRef.afterClosed().subscribe((result) => {
    //   if (result) {
    //     const component = dialogRef.componentInstance;
    //     component.setSubmitting(true);

    const component = dialogRef.componentInstance;
    component.submitForm.subscribe((result) => {

      const request$ = this.rolesApi.updateRole(role.id, result.data as UpdateRoleRequest);
      request$.subscribe({
        next: (response) => {
          component.setSubmitting(false);
          dialogRef.close();
          this.toast.success(
            response.message || 'Rol actualizado exitosamente',
            'Éxito'
          );
          this.loadRoles();
        },
        error: (err) => {
          component.setSubmitting(false);
          const message = err.error?.message || 'Error al actualizar rol';
          console.error('[RolesPage] updateRole()', err);
          this.toast.error(message, 'Error');
        }
      });
    });
  }

  deleteRole(role: Role): void {
    if (role.isSystem) {
      this.toast.warning('No se puede eliminar un rol del sistema', 'Aviso');
      return;
    }

    this.confirmDialog.confirm({
      variant: 'danger',
      title: 'Confirmar eliminación',
      message: `¿Está seguro de eliminar el rol "${role.name}"?`,
      confirmText: 'Eliminar',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.isSubmitting.set(true);
        this.rolesApi.deleteRole(role.id).subscribe({
          next: (response) => {
            this.isSubmitting.set(false);
            this.toast.success(response.message || 'Rol eliminado exitosamente', 'Éxito');
            this.loadRoles();
          },
          error: (err) => {
            this.isSubmitting.set(false);
            const message = err.error?.message || 'Error al eliminar rol';
            console.error('[RolesPage] deleteRole()', err);
            this.toast.error(message, 'Error');
          }
        });
      }
    });
  }

}

