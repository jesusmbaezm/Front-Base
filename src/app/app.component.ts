import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthStateService } from './core/session/auth-state.service';
import { InactivityService } from './core/session/inactivity.service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class App {
  public readonly appName = 'SIG JAEL';

  private readonly authState = inject(AuthStateService);
  private readonly inactivityService = inject(InactivityService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.authState.debugState('AppComponent constructor - before subscribe');

    this.authState.isAuthenticated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isAuthenticated) => {
        this.authState.debugState('AppComponent subscription');

        if (isAuthenticated) {
          this.inactivityService.start();
        } else {
          this.inactivityService.stop();
        }
      });
  }
}
