import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ModalFooterComponent } from '@app/shared/components/modal-footer/modal-footer.component';

import { User, CreateUserRequest, UpdateUserRequest } from '@app/core/models/user.models';
import { Role } from '@app/core/models/role.model';
import { SimpleBranch } from '@app/core/models/user.models';

export interface UserFormDialogData {
  user?: User;
  roles: Role[];
  branches: SimpleBranch[];
  isEdit: boolean;
}

export interface UserFormSubmitResult {
  data: CreateUserRequest | UpdateUserRequest;
  isEdit: boolean;
  newPassword?: string;
}

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ModalFooterComponent,
  ],
  templateUrl: './user-form-dialog.html',
  styleUrl: './user-form-dialog.scss',
})
export class UserFormDialog {
  @Output() submitForm = new EventEmitter<UserFormSubmitResult>();

  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<UserFormDialog>);
  readonly data = inject<UserFormDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = this.data.isEdit;
  readonly roles = this.data.roles;
  readonly branches = this.data.branches;

  readonly hidePassword = signal(true);
  readonly isSubmitting = signal(false);

  readonly form: FormGroup = this.fb.group({
    name: [this.data.user?.name ?? '', [Validators.required, Validators.minLength(3)]],
    email: [this.data.user?.email ?? '', [Validators.required, Validators.email]],
    password: ['', this.isEdit ? [] : [Validators.required, Validators.minLength(8)]],
    roleIds: [[...this.getUserRoleIds()], [Validators.required]],
    branchIds: [[...this.getUserBranchIds()], [Validators.required]],
    isActive: [this.data.user?.isActive ?? true],
  });

  togglePasswordVisibility(): void {
    this.hidePassword.update((value) => !value);
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;

    if (this.isEdit) {
      const updatePayload: UpdateUserRequest = {
        name: formValue.name,
        email: formValue.email,
        roleIds: formValue.roleIds,
        branchIds: formValue.branchIds,
        isActive: formValue.isActive,
      };

      this.submitForm.emit({ data: updatePayload, isEdit: true });
    } else {
      const createPayload: CreateUserRequest = {
        name: formValue.name,
        email: formValue.email,
        password: formValue.password,
        roleIds: formValue.roleIds,
        branchIds: formValue.branchIds,
      };

      this.submitForm.emit({ data: createPayload, isEdit: false });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
  private getUserRoleIds(): number[] {
    return this.data.user?.roles?.map((r) => r.id) ?? [];
  }
  private getUserBranchIds(): number[] {
    return this.data.user?.branches?.map((b) => b.id) ?? [];
  }
}
