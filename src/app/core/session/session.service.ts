import { Injectable, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SessionState, UserProfile } from '../models/auth.models';
import { TokenStorageService } from '../security/token-storage.service';
import { AuthStateService } from './auth-state.service';
import { AuthApiService } from '../security/auth-api.service';
import { InactivityService } from './inactivity.service';
import { SessionExpiryDialogComponent } from '@app/shared/components/session-expiry-dialog/session-expiry-dialog.component';

const REFRESH_TRIGGER_MS = 5 * 60 * 1000; // disparar 5 min antes de expirar
const ACTIVITY_WINDOW_MS = 5 * 60 * 1000; // activo si hubo acción en los últimos 5 min
const RETRY_DELAY_MS = 30_000;             // reintentar en 30s si falla la red

const INITIAL_SESSION_STATE: SessionState = {
  isAuthenticated: false,
  accessToken: null,
  user: null,
  expiresAt: null,
};

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly tokenStorageService = inject(TokenStorageService);
  private readonly authState = inject(AuthStateService);
  private readonly authApi = inject(AuthApiService);
  private readonly inactivityService = inject(InactivityService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private refreshTimerId: ReturnType<typeof setTimeout> | null = null;
  private visibilityHandler?: () => void;
  private logoutChannel: BroadcastChannel | null = null;

  private readonly sessionState = signal<SessionState>(INITIAL_SESSION_STATE);

  readonly state = computed(() => this.sessionState());
  readonly isAuthenticated = computed(() => this.sessionState().isAuthenticated);
  readonly user = computed(() => this.sessionState().user);
  readonly accessToken = computed(() => this.sessionState().accessToken);
  readonly expiresAt = computed(() => this.sessionState().expiresAt);

  startSession(params: { accessToken: string; expiresAt: number; user: UserProfile }): void {
    this.tokenStorageService.saveSession({
      accessToken: params.accessToken,
      expiresAt: params.expiresAt,
      user: params.user,
    });

    this.sessionState.set({
      isAuthenticated: true,
      accessToken: params.accessToken,
      expiresAt: params.expiresAt,
      user: params.user,
    });

    this.authState.setSession(params.accessToken, {
      id: params.user.id,
      name: params.user.fullName,
      email: params.user.email,
      roles: params.user.roles ?? [],
      permissions: params.user.permissions ?? [],
      branches: params.user.branches ?? [],
    });

    this.scheduleRefreshTimer();
    this.registerVisibilityListener();
    this.initLogoutChannel();
  }

  restoreSession(): void {
    const storedSession = this.tokenStorageService.getSession();

    if (!storedSession?.accessToken || !storedSession?.user) {
      this.clearSession();
      return;
    }

    // Si el token ya expiró, limpiar y no restaurar
    if (storedSession.expiresAt && storedSession.expiresAt <= Date.now()) {
      this.clearSession();
      return;
    }

    this.sessionState.set({
      isAuthenticated: true,
      accessToken: storedSession.accessToken,
      expiresAt: storedSession.expiresAt,
      user: storedSession.user,
    });

    this.authState.setSession(storedSession.accessToken, {
      id: storedSession.user.id,
      name: storedSession.user.fullName,
      email: storedSession.user.email,
      roles: storedSession.user.roles ?? [],
      permissions: storedSession.user.permissions ?? [],
      branches: storedSession.user.branches ?? [],
    });

    // Reprogramar timer tras recargar la página
    this.scheduleRefreshTimer();
    this.registerVisibilityListener();
    this.initLogoutChannel();
  }

  clearSession(broadcast = false): void {
    const wasAuthenticated = this.sessionState().isAuthenticated;
    this.clearRefreshTimer();
    this.unregisterVisibilityListener();
    this.dialog.closeAll();
    this.tokenStorageService.clear();
    this.sessionState.set(INITIAL_SESSION_STATE);
    this.authState.clearSession();
    if (wasAuthenticated && broadcast) {
      this.logoutChannel?.postMessage('logout');
    }
    if (wasAuthenticated) {
      this.router.navigate(['/login']);
    }
  }

  // Usar para logout explícito del usuario — propaga a todos los tabs.
  logout(): void {
    this.clearSession(true);
  }

  private scheduleRefreshTimer(): void {
    const expiresAt = this.sessionState().expiresAt;
    if (!expiresAt) return;

    this.clearRefreshTimer();

    const msUntilExpiry = expiresAt - Date.now();

    if (msUntilExpiry <= 0) {
      // Token ya expirado
      this.clearSession();
      return;
    }

    // Disparar REFRESH_TRIGGER_MS antes de expirar, o inmediatamente si ya estamos en ventana
    const delay = Math.max(0, msUntilExpiry - REFRESH_TRIGGER_MS);

    this.refreshTimerId = setTimeout(() => this.handleTokenRefresh(), delay);
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimerId) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }
  }

  private registerVisibilityListener(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.unregisterVisibilityListener();
    this.visibilityHandler = () => this.onTabVisible();
    this.document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private unregisterVisibilityListener(): void {
    if (this.visibilityHandler) {
      this.document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = undefined;
    }
  }

  private onTabVisible(): void {
    if (this.document.visibilityState !== 'visible') return;
    if (!this.sessionState().isAuthenticated) return;

    const expiresAt = this.sessionState().expiresAt;
    if (!expiresAt) return;

    const msUntilExpiry = expiresAt - Date.now();

    if (msUntilExpiry <= 0) {
      // Token ya expirado mientras el usuario estaba en otro tab
      this.clearSession();
      return;
    }

    // Si queda menos de REFRESH_TRIGGER_MS, reprogramar el timer inmediatamente
    // para que dispare sin esperar el delay original que pudo quedar desincronizado
    if (msUntilExpiry <= REFRESH_TRIGGER_MS) {
      this.scheduleRefreshTimer();
    }
  }

  private handleTokenRefresh(): void {
    if (this.inactivityService.isRecentlyActive(ACTIVITY_WINDOW_MS)) {
      this.refreshSilently();
    } else {
      this.showExpiryDialog();
    }
  }

  private refreshSilently(): void {
    this.authApi.refreshToken().subscribe({
      next: (response) => {
        this.updateSessionToken(response.accessToken, response.expiresAt);
        this.scheduleRefreshTimer();
      },
      error: (err) => {
        if (err.status === 0) {
          // Error de red: reintentar en 30s
          this.refreshTimerId = setTimeout(() => this.handleTokenRefresh(), RETRY_DELAY_MS);
        } else if (err.status === 400 && (this.sessionState().expiresAt ?? 0) > Date.now()) {
          // Backend rechazó porque el JWT aún no está en ventana de renovación.
          // El token sigue siendo válido — no cerrar sesión, simplemente no hacer nada.
          // En producción esto no ocurre porque REFRESH_TRIGGER_MS < ventana del backend (10 min).
        } else {
          // Token expirado o inválido (401): cerrar sesión
          this.clearSession();
        }
      },
    });
  }

  private showExpiryDialog(): void {
    // Evitar abrir dos modales si ya hay uno
    if (this.dialog.openDialogs.length > 0) return;

    const dialogRef = this.dialog.open(SessionExpiryDialogComponent, {
      width: '400px',
      disableClose: true,
      panelClass: 'session-dialog',
    });

    dialogRef.afterClosed().subscribe((result: 'extend' | 'logout') => {
      if (result === 'extend') {
        this.refreshSilently();
      } else {
        this.clearSession();
      }
    });
  }

  private initLogoutChannel(): void {
    if (!isPlatformBrowser(this.platformId) || this.logoutChannel) return;
    this.logoutChannel = new BroadcastChannel('jael_logout');
    this.logoutChannel.onmessage = (event) => {
      if (event.data === 'logout' && this.sessionState().isAuthenticated) {
        this.clearSession(false);
      }
    };
  }

  private updateSessionToken(accessToken: string, expiresAt: number): void {
    const currentUser = this.sessionState().user;
    const user: UserProfile = currentUser ?? {
      id: '',
      email: '',
      fullName: '',
      roles: [],
      permissions: [],
      branches: [],
    };

    this.tokenStorageService.saveSession({ accessToken, expiresAt, user });

    this.sessionState.update((state) => ({ ...state, accessToken, expiresAt }));

    this.authState.setSession(accessToken, {
      id: user.id,
      name: user.fullName,
      email: user.email,
      roles: user.roles ?? [],
      permissions: user.permissions ?? [],
      branches: user.branches ?? [],
    });
  }
}
