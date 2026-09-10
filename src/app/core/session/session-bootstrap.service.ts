import { Injectable, inject } from '@angular/core';
import { InactivityService } from './inactivity.service';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class SessionBootstrapService {
  private readonly inactivityService = inject(InactivityService);
  private readonly sessionService = inject(SessionService);

  init(): void {
    console.log('[SessionBootstrap] init()');

    this.sessionService.restoreSession();

    if (this.sessionService.isAuthenticated()) {
      console.log('[SessionBootstrap] sesión encontrada, iniciando monitoreo de inactividad');
      this.inactivityService.start();
      return;
    }

    console.log('[SessionBootstrap] no hay sesión activa');
    this.inactivityService.stop();
  }
}