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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ModalFooterComponent } from '@app/shared/components/modal-footer/modal-footer.component';

export interface ResetPasswordDialogData {
  userId: number;
  userName: string;
}

@Component({
  selector: 'app-reset-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ModalFooterComponent,
  ],
  templateUrl: './reset-password-dialog.html',
  styleUrl: './reset-password-dialog.scss',
})
export class ResetPasswordDialog {
  @Output() submitPassword = new EventEmitter<{ userId: number; newPassword: string }>();

  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<ResetPasswordDialog>);
  readonly data = inject<ResetPasswordDialogData>(MAT_DIALOG_DATA);

  readonly hidePassword = signal(true);
  readonly hideConfirmPassword = signal(true);
  readonly isSubmitting = signal(false);

  readonly form: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  togglePasswordVisibility(field: 'newPassword' | 'confirmPassword'): void {
    if (field === 'newPassword') {
      this.hidePassword.update((value) => !value);
    } else {
      this.hideConfirmPassword.update((value) => !value);
    }
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

    if (formValue.newPassword !== formValue.confirmPassword) {
      this.form.get('confirmPassword')?.setErrors({ mismatch: true });
      return;
    }

    this.submitPassword.emit({ userId: this.data.userId, newPassword: formValue.newPassword });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
