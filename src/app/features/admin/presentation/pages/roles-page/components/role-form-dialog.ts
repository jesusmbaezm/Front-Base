import { Component, inject, signal, computed, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ModalFooterComponent } from '@app/shared/components/modal-footer/modal-footer.component';

import { RolesApiService } from '@app/core/security/roles-api.service';
import { Role, CreateRoleRequest, UpdateRoleRequest } from '@app/core/models/role.model';
import { Permission } from '@app/core/models/permissions.model';

export interface RoleFormDialogData {
  role?: Role;
  isEdit: boolean;
}


interface PermissionDisplay {
  id: number;
  name: string;
  description: string;
  label: string;
}

interface PermissionGroup {
  name: string;
  label: string;
  module: string;
  permissions: PermissionDisplay[];
}

interface ModuleGroup {
  module: string;
  subgroups: PermissionGroup[];
}

@Component({
  selector: 'app-role-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    ModalFooterComponent,
  ],
  templateUrl: './role-form-dialog.html',
  styleUrl: './role-form-dialog.scss'
})
export class RoleFormDialog implements OnInit {

  @Output() submitForm = new EventEmitter<{
    data: CreateRoleRequest | UpdateRoleRequest;
    isEdit: boolean;
  }>();

  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<RoleFormDialog>);
  private readonly rolesApi = inject(RolesApiService);
  readonly data = inject<RoleFormDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = this.data.isEdit;
  readonly isSystem = this.data.role?.isSystem ?? false;

  readonly allPermissions = signal<Permission[]>([]);
  readonly isLoadingData = signal(true);
  readonly isSubmitting = signal(false);
  readonly searchQuery = signal('');
  readonly expandedGroups = signal<Set<string>>(new Set());

  readonly form: FormGroup = this.fb.group({
    name: [this.data.role?.name ?? '', [Validators.required, Validators.minLength(3)]],
    description: [this.data.role?.description ?? '', Validators.required],
    permissionIds: [this.data.role?.permissions?.map(p => p.id) ?? [], [Validators.required]],
  });

  readonly permissionGroups = computed<PermissionGroup[]>(() => {
    const perms = this.allPermissions();
    // API returns permissions already sorted by SortOrder — Map preserves insertion order.
    const groupMap = new Map<string, { module: string; permissions: PermissionDisplay[] }>();

    for (const perm of perms) {
      const display: PermissionDisplay = {
        id: perm.id,
        name: perm.name,
        description: perm.description,
        label: perm.label || perm.name,
      };
      // Key = module::submodule keeps same-named submodules in different modules separate
      // (e.g. "Devoluciones" in Ventas vs Autorizaciones)
      const groupKey = `${perm.module}::${perm.submodule}`;
      if (!groupMap.has(groupKey)) groupMap.set(groupKey, { module: perm.module, permissions: [] });
      groupMap.get(groupKey)!.permissions.push(display);
    }

    return Array.from(groupMap.entries()).map(([groupKey, { module, permissions }]) => {
      const submodule = groupKey.split('::')[1];
      return {
        name: `${module}-${submodule}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        label: submodule,
        module,
        permissions,
      };
    });
  });

  readonly filteredGroups = computed<PermissionGroup[]>(() => {
    const raw = this.searchQuery().toLowerCase().trim();
    const groups = this.permissionGroups();
    if (!raw) return groups;

    // Dividir por "." permite buscar "customerreturn.read" y encontrar "customerreturns.read"
    // porque evalúa cada fragmento por separado y exige que todos estén presentes.
    const tokens = raw.split('.').filter(t => t.length > 0);

    const matchesPerm = (p: PermissionDisplay): boolean => {
      const haystack = `${p.name} ${p.label} ${p.description}`.toLowerCase();
      return tokens.every(t => haystack.includes(t));
    };

    return groups
      .map(g => {
        const modSub = `${g.module} ${g.label}`.toLowerCase();
        // Si módulo o submodulo coincide (con o sin punto) → mostrar todo el grupo
        if (modSub.includes(raw) || tokens.every(t => modSub.includes(t))) {
          return g;
        }
        return {
          ...g,
          permissions: g.permissions.filter(matchesPerm),
        };
      })
      .filter(g => g.permissions.length > 0);
  });

  readonly filteredModuleGroups = computed<ModuleGroup[]>(() => {
    const groups = this.filteredGroups();
    const moduleMap = new Map<string, PermissionGroup[]>();
    for (const group of groups) {
      const mod = group.module || group.label;
      if (!moduleMap.has(mod)) moduleMap.set(mod, []);
      moduleMap.get(mod)!.push(group);
    }
    // Map preserves insertion order — filteredGroups already sorted by module+submodule
    return Array.from(moduleMap.entries()).map(([module, subgroups]) => ({ module, subgroups }));
  });

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions(): void {
    this.rolesApi.getPermissions().subscribe({
      next: (response) => {
        this.allPermissions.set(response.data);
        const expanded = new Set(this.permissionGroups().map(g => g.name));
        this.expandedGroups.set(expanded);
        this.isLoadingData.set(false);
      },
      error: (err) => {
        console.error('[RoleFormDialog] loadPermissions()', err);
        this.isLoadingData.set(false);
        this.dialogRef.close({ error: 'Error al cargar permisos' });
      },
    });
  }

  isGroupExpanded(groupName: string): boolean {
    return this.expandedGroups().has(groupName);
  }

  toggleGroup(groupName: string): void {
    const set = new Set(this.expandedGroups());
    if (set.has(groupName)) set.delete(groupName);
    else set.add(groupName);
    this.expandedGroups.set(set);
  }

  isPermissionSelected(permId: number): boolean {
    return (this.form.get('permissionIds')?.value ?? []).includes(permId);
  }

  isGroupAllSelected(group: PermissionGroup): boolean {
    const ids: number[] = this.form.get('permissionIds')?.value ?? [];
    return group.permissions.every(p => ids.includes(p.id));
  }

  isGroupIndeterminate(group: PermissionGroup): boolean {
    const ids: number[] = this.form.get('permissionIds')?.value ?? [];
    const count = group.permissions.filter(p => ids.includes(p.id)).length;
    return count > 0 && count < group.permissions.length;
  }

  toggleGroupAll(group: PermissionGroup, checked: boolean): void {
    let ids: number[] = [...(this.form.get('permissionIds')?.value ?? [])];
    if (checked) {
      group.permissions.forEach(p => { if (!ids.includes(p.id)) ids.push(p.id); });
    } else {
      const groupIds = new Set(group.permissions.map(p => p.id));
      ids = ids.filter(id => !groupIds.has(id));
    }
    this.form.patchValue({ permissionIds: ids });
  }

  togglePermission(permId: number, checked: boolean): void {
    let ids: number[] = [...(this.form.get('permissionIds')?.value ?? [])];
    if (checked) {
      if (!ids.includes(permId)) ids.push(permId);
    } else {
      ids = ids.filter(id => id !== permId);
    }
    this.form.patchValue({ permissionIds: ids });
  }

  selectAll(): void {
    const allIds = this.allPermissions().map(p => p.id);
    this.form.patchValue({ permissionIds: allIds });
  }

  deselectAll(): void {
    this.form.patchValue({ permissionIds: [] });
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, description, permissionIds } = this.form.value;
    this.submitForm.emit({
      data: { name, description, permissionIds } as CreateRoleRequest | UpdateRoleRequest,
      isEdit: this.isEdit,
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  get selectedCount(): number {
    return this.form.get('permissionIds')?.value?.length ?? 0;
  }
}
