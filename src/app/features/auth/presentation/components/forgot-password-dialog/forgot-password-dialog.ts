import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthApiService } from '@app/core/security/auth-api.service';
import { ModalFooterComponent } from '@app/shared/components/modal-footer/modal-footer.component';

@Component({
  selector: 'app-forgot-password-dialog',
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
  templateUrl: './forgot-password-dialog.html',
  styleUrl: './forgot-password-dialog.scss',
})
export class ForgotPasswordDialog {
  @Output() submitted = new EventEmitter<string>();

  private readonly fb = inject(FormBuilder);
  private readonly authApiService = inject(AuthApiService);
  readonly dialogRef = inject(MatDialogRef<ForgotPasswordDialog>);

  readonly isSubmitting = signal(false);
  readonly isSubmitImail = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly successNewPasswordMessage = signal<string | null>(null);
  readonly hidePassword = signal(true);
  readonly hideConfirmPassword = signal(true);

  readonly form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    token: [{ value: '', disabled: true },[Validators.required]],
    newPassword: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(8)]],
    confirmPassword: [{ value: '', disabled: true }, [Validators.required]],
  });

  get emailControl() {
    return this.form.get('email');
  }

  get tokenControl() {
    return this.form.get('token');
  }

  get newPasswordControl() {
    return this.form.get('newPassword');
  }

  get confirmPasswordControl() {
    return this.form.get('confirmPassword');
  }

  togglePasswordVisibility(field: 'newPassword' | 'confirmPassword'): void {
    if (field === 'newPassword') {
      this.hidePassword.update((value) => !value);
    } else {
      this.hideConfirmPassword.update((value) => !value);
    }
  }

  onSubmit(accion: string): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if(accion == "F"){
      this.forgotPassword();
    }
    else if(accion == "N"){
      this.newPassword();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onlyNumbers(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    
    // Permitir: backspace, delete, tab, flechas
    if ([8, 9, 37, 39, 46].includes(charCode)) {
      return;
    }

    // Bloquear si no es número (0-9)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  forgotPassword(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isSubmitting.set(true);

    const email = this.form.get('email')?.value?.trim();

    this.authApiService.forgotPassword({ email}).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Se ha enviado un correo para recuperar tu contraseña (Si no ha llagado correo en al menos un minuto pruebe en solicitar enviar correo).');

        this.isSubmitImail.set(true);
        this.setControlsNewPassword();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('No fue posible procesar la solicitud. Inténtalo más tarde.');
      },
    });
  }

  newPassword(): void {
    
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.successNewPasswordMessage.set(null);
    this.isSubmitting.set(true);

    const formValue = this.form.value;

    if (formValue.newPassword !== formValue.confirmPassword) {
      this.form.get('confirmPassword')?.setErrors({ mismatch: true });
      this.isSubmitting.set(false);
      return;
    }

    const email = this.form.get('email')?.value?.trim();
    const token = this.form.get('token')?.value?.trim();
    const newPassword = this.form.get('newPassword')?.value?.trim();

    this.authApiService.ResetPassword({ email, token, newPassword }).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.successNewPasswordMessage.set('La contraseña a sido cambiada correctamente.');
        
        setTimeout(() => this.dialogRef.close(), 3000);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Solicitud de recuperacion invalida o expirada.');
      },
    });
  }

  setControlsNewPassword():void {
    this.emailControl?.disable();
    this.tokenControl?.enable();
    this.newPasswordControl?.enable();
    this.confirmPasswordControl?.enable();
  }
}
