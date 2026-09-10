import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { ButtonComponent } from '@app/shared/components/button/button.component';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AppPaginatorComponent } from '@app/shared/components/paginator/paginator.component';
import { BadgeComponent } from '@app/shared/components/badge/badge.component';

import { UsersApiService } from '@app/core/security/users-api.service';
import { RolesApiService } from '@app/core/security/roles-api.service';
import { BranchesApiService } from '@app/core/security/branches-api.service';
import { ToastService } from '@app/shared/services/toast.service';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilter,
} from '@app/core/models/user.models';
import { Role } from '@app/core/models/role.model';
import { BranchOption } from '@app/core/models/branch.models';
import { UserFormDialog, UserFormSubmitResult } from './components/user-form-dialog';
import { ResetPasswordDialog } from './components/reset-password-dialog';
import { HasPermissionDirective } from '@app/core/directives/has-permission.directive';
import { PERMISSIONS } from '@app/core/security/permissions';
import { AuthStateService } from '@app/core/session/auth-state.service';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    ButtonComponent,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    AppPaginatorComponent,
    BadgeComponent,
    HasPermissionDirective,
  ],
  templateUrl: './users-page.html',
  styleUrl: './users-page.scss',
})
export class UsersPage implements OnInit {
  protected readonly Permissions = PERMISSIONS;
  private readonly usersApi = inject(UsersApiService);
  private readonly rolesApi = inject(RolesApiService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly authState = inject(AuthStateService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly users = signal<User[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly branches = signal<BranchOption[]>([]);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);

  readonly searchControl = signal('');
  readonly selectedRoleId = signal<number | null>(null);
  readonly selectedStatus = signal<boolean | null>(null);

  readonly pageIndex = signal(0);
  readonly pageSize = signal(50);
  readonly totalCount = signal(0);

  readonly statusOptions = [
    { value: null, label: 'Todos' },
    { value: true, label: 'Activos' },
    { value: false, label: 'Inactivos' },
  ];

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly displayedColumns = ['expand', 'user', 'role', 'branches', 'status', 'actions'];
  readonly expandedUserId = signal<number | null>(null);

  readonly isRowExpanded = (user: any) => {
    return this.expandedUserId() === user.id;
  };

  ngOnInit(): void {
    this.loadRoles();
    if (this.authState.hasAnyPermission([
      PERMISSIONS.users.create,
      PERMISSIONS.users.update,
    ])) {
      this.loadBranches();
    }
    this.loadUsers();
  }

  loadRoles(): void {
    this.rolesApi.getRolesSelect().subscribe({
      next: (response) => this.roles.set(response.data),
      error: (err) => console.error('[UsersPage] loadRoles()', err),
    });
  }

  loadBranches(): void {
    this.branchesApi.getDestinationBranches().subscribe({
      next: (response) => this.branches.set(response.data),
      error: (err) => console.error('[UsersPage] loadBranches()', err),
    });
  }

  loadUsers(): void {
    this.isLoading.set(true);

    const filter: UserFilter = {
      search: this.searchControl() || undefined,
      roleId: this.selectedRoleId() ?? undefined,
      isActive: this.selectedStatus() ?? undefined,
      page: this.pageIndex() + 1,
      pageSize: this.pageSize(),
    };

    this.usersApi.getUsersPaged(filter).subscribe({
      next: (response) => {
        this.users.set(response.data.items);
        this.totalCount.set(response.data.totalCount);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[UsersPage] loadUsers()', err);
        this.isLoading.set(false);
        this.toast.error('Error al cargar usuarios', 'Error');
      },
    });
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page - 1);
    this.loadUsers();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(0);
    this.loadUsers();
  }

  onSearchInput(value: string): void {
    this.searchControl.set(value);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.pageIndex.set(0);
      this.loadUsers();
    }, 400);
  }

  onStatusChange(value: boolean | null): void {
    this.selectedStatus.set(value);
    this.pageIndex.set(0);
    this.loadUsers();
  }

  onRoleChange(value: number | null): void {
    this.selectedRoleId.set(value);
    this.pageIndex.set(0);
    this.loadUsers();
  }

  getStatusVariant(isActive: boolean): string {
    return isActive ? 'success' : 'neutral-soft';
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Activo' : 'Inactivo';
  }

  toggleRow(userId: number): void {
    this.expandedUserId.set(this.expandedUserId() === userId ? 0 : userId);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  getAvatarStyle(roleName: string): object {
    const styles: Record<string, object> = {
      Admin: { background: '#f0f0f8', color: '#3730a3' },
      Almacenista: { background: '#eef9f4', color: '#1a7a4a' },
      Autorizador: { background: '#fff4e5', color: '#c2590a' },
      Cajero: { background: '#fdf3f3', color: '#b91c1c' },
    };
    return styles[roleName] ?? { background: '#f5f5f5', color: '#888' };
  }

  getRoleBadgeClass(roleName: string): string {
    const classes: Record<string, string> = {
      Admin: 'role-admin',
      Almacenista: 'role-alm',
      Autorizador: 'role-auth',
      Cajero: 'role-cajero',
    };
    return classes[roleName] ?? '';
  }

  clearFilters(): void {
    this.searchControl.set('');
    this.selectedRoleId.set(null);
    this.selectedStatus.set(null);
    this.pageIndex.set(0);
    this.loadUsers();
  }

  async openCreateDialog(): Promise<void> {
    const dialogRef = this.dialog.open(UserFormDialog, {
      panelClass: 'demo-dialog-panel',
      width: '500px',
      disableClose: true,
      data: { roles: this.roles(), branches: this.branches(), isEdit: false },
    });
    dialogRef.componentInstance.submitForm.subscribe((result) => {
      dialogRef.componentInstance.setSubmitting(true);
      this.usersApi.createUser(result.data as CreateUserRequest).subscribe({
        next: (response) => {
          dialogRef.componentInstance.setSubmitting(false);
          dialogRef.close(true);
          this.toast.success(response.message || 'Usuario creado exitosamente', 'Éxito');
          this.loadUsers();
        },
        error: (err) => {
          dialogRef.componentInstance.setSubmitting(false);
          this.toast.error(err.error?.message || 'Error al crear usuario', 'Error');
        },
      });
    });
  }

  async openEditDialog(user: User): Promise<void> {
    const dialogRef = this.dialog.open(UserFormDialog, {
      panelClass: 'demo-dialog-panel',
      width: '500px',
      disableClose: true,
      data: { user, roles: this.roles(), branches: this.branches(), isEdit: true },
    });
    dialogRef.componentInstance.submitForm.subscribe((result: UserFormSubmitResult) => {
      dialogRef.componentInstance.setSubmitting(true);
      const updateUser$ = this.usersApi.updateUser(user.id, result.data as UpdateUserRequest);

      if (result.newPassword) {
        updateUser$
          .pipe(switchMap(() => this.usersApi.resetPassword(user.id, result.newPassword!)))
          .subscribe({
            next: (response) => {
              dialogRef.componentInstance.setSubmitting(false);
              dialogRef.close(true);
              this.toast.success(
                response.message || 'Usuario y contraseña actualizados exitosamente',
                'Éxito',
              );
              this.loadUsers();
            },
            error: (err) => {
              dialogRef.componentInstance.setSubmitting(false);
              this.toast.error(err.error?.message || 'Error al actualizar usuario', 'Error');
            },
          });

        return;
      }

      updateUser$.subscribe({
        next: (response) => {
          dialogRef.componentInstance.setSubmitting(false);
          dialogRef.close(true);
          this.toast.success(response.message || 'Usuario actualizado exitosamente', 'Éxito');
          this.loadUsers();
        },
        error: (err) => {
          dialogRef.componentInstance.setSubmitting(false);
          this.toast.error(err.error?.message || 'Error al actualizar usuario', 'Error');
        },
      });
    });
  }

  toggleUserStatus(user: User): void {
    const newStatus = !user.isActive;
    const action = newStatus ? 'activar' : 'desactivar';
    this.confirmDialog
      .confirm({
        variant: 'warning',
        title: 'Confirmar acción',
        message: `¿Está seguro de ${action} el usuario "${user.name}"?`,
        confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.isSubmitting.set(true);
        this.usersApi
          .updateUser(user.id, {
            name: user.name,
            email: user.email,
            roleIds: user.roles.map((r) => r.id),
            branchIds: user.branches.map((b) => b.id),
            isActive: newStatus,
          })
          .subscribe({
            next: (response) => {
              this.isSubmitting.set(false);
              this.loadUsers();
              this.toast.success(
                response.message ||
                  `Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente`,
                'Éxito',
              );
            },
            error: (err) => {
              this.isSubmitting.set(false);
              this.toast.error(
                err.error?.message || 'Error al cambiar estado del usuario',
                'Error',
              );
            },
          });
      });
  }

  deleteUser(user: User): void {
    this.confirmDialog
      .confirm({
        variant: 'danger',
        title: 'Confirmar eliminación',
        message: `¿Está seguro de eliminar el usuario "${user.name}"?`,
        confirmText: 'Eliminar',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.isSubmitting.set(true);
        this.usersApi.deleteUser(user.id).subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.toast.success('Usuario eliminado exitosamente', 'Éxito');
            this.loadUsers();
          },
          error: (err) => {
            this.isSubmitting.set(false);
            this.toast.error(err.error?.message || 'Error al eliminar usuario', 'Error');
          },
        });
      });
  }

  async openResetPasswordDialog(user: User): Promise<void> {
    const dialogRef = this.dialog.open(ResetPasswordDialog, {
      panelClass: 'demo-dialog-panel',
      width: '400px',
      disableClose: true,
      data: { userId: user.id, userName: user.name },
    });
    dialogRef.componentInstance.submitPassword.subscribe(({ userId, newPassword }) => {
      dialogRef.componentInstance.setSubmitting(true);
      this.usersApi.resetPassword(userId, newPassword).subscribe({
        next: (response) => {
          dialogRef.componentInstance.setSubmitting(false);
          dialogRef.close(true);
          this.toast.success(response.message || 'Contraseña actualizada exitosamente', 'Éxito');
        },
        error: (err) => {
          dialogRef.componentInstance.setSubmitting(false);
          this.toast.error(err.error?.message || 'Error al cambiar la contraseña', 'Error');
        },
      });
    });
  }
}
