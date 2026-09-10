import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-login-details',
  standalone: true,
  templateUrl: './login-details.html',
  styleUrl: './login-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginDetails {
  @Input() title = 'Bienvenido';
  @Input() subtitle = 'Accede con tus credenciales para continuar.';
  @Input() appName = 'SIG JAEL';
}
