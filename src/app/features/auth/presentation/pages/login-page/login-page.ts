import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { AuthApiService } from '../../../../../core/security/auth-api.service';
import { TokenStorageService } from '../../../../../core/security/token-storage.service';
import { SessionService } from '../../../../../core/session/session.service';
import { APP_PATHS } from '../../../../../core/navigation/app-paths';
import { LoginRequest, LoginResponse } from '../../../../../core/models/auth.models';
import { ForgotPasswordDialog } from '../../components/forgot-password-dialog/forgot-password-dialog';
import { ToastService } from '@app/shared/services/toast.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApiService = inject(AuthApiService);
  private readonly tokenStorageService = inject(TokenStorageService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  readonly loginForm = this.fb.nonNullable.group({
    usuario:  ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  showPassword = false;
  loading = false;
  loginError = '';

  ngOnInit(): void {
    const reason = new URLSearchParams(window.location.search).get('reason');
    if (reason === 'session-expired') {
      this.toast.info('Tu sesión se cerró por inactividad.', 'Información');
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onForgotPassword(): void {
    this.dialog.open(ForgotPasswordDialog, {
      panelClass: 'demo-dialog-panel',
      width: '400px',
      disableClose: true,
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loginError = '';
    this.loading = true;

    const payload: LoginRequest = {
      email: this.loginForm.controls.usuario.getRawValue().trim(),
      password: this.loginForm.controls.password.getRawValue(),
    };

    this.authApiService
      .login(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (response) => this.handleLoginSuccess(response),
        error: (error: HttpErrorResponse) => this.handleLoginError(error),
      });
  }

  private handleLoginSuccess(response: LoginResponse): void {
    this.sessionService.startSession({
      accessToken: response.accessToken,
      expiresAt: response.expiresAt,
      user: response.user,
    });

    void this.router.navigate([APP_PATHS.dashboard]);
  }

  private handleLoginError(error: HttpErrorResponse): void {
    if (error.status === 0) {
      this.loginError = 'No fue posible conectar con el servidor.';
      return;
    }

    if (error.status === 401) {
      this.loginError = 'Usuario o contraseña incorrectos.';
      return;
    }

    if (error.status === 403) {
      this.loginError = 'No tienes permisos para ingresar.';
      return;
    }

    this.loginError = 'Ocurrió un error inesperado. Inténtalo nuevamente.';
  }
}
