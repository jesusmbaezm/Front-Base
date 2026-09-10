import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login-form.html',
  styleUrl: './login-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginForm {
  @Input({ required: true }) form!: FormGroup;
  @Input() isSubmitting = false;
  @Input() errorMessage: string | null = null;

  @Output() submitted = new EventEmitter<void>();
  @Output() forgotPassword = new EventEmitter<string>();

  readonly hidePassword = signal(true);

  onSubmit(): void {
    this.submitted.emit();
  }

  togglePasswordVisibility(): void {
    this.hidePassword.update((value) => !value);
  }

  get emailControl() {
    return this.form.get('email');
  }

  get passwordControl() {
    return this.form.get('password');
  }

  onForgotPassword(): void {
    const email = this.emailControl?.value?.trim();
    if (email) {
      this.forgotPassword.emit(email);
    }
  }
}
