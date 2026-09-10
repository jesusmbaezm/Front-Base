import {
  Inject,
  Injectable,
  PLATFORM_ID,
  computed,
  signal
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface SimpleBranch {
  id: number;
  name: string;
  isMain: boolean;
}

export interface AuthUser {
  id: number | string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  branches: SimpleBranch[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private readonly isBrowser: boolean;

  private readonly tokenState = signal<string | null>(null);
  private readonly userState = signal<AuthUser | null>(null);

  readonly token = computed(() => this.tokenState());
  readonly user = computed(() => this.userState());
  readonly permissions = computed(() => this.userState()?.permissions ?? []);
  readonly isAuthenticated = computed(() => !!this.tokenState());
  readonly hasMainBranch = computed(() => this.userState()?.branches.some(b => b.isMain) ?? false);
  readonly mainBranchName = computed(() => this.userState()?.branches.find(b => b.isMain)?.name ?? '');

  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  readonly isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    console.log('[AuthState] constructor - isBrowser:', this.isBrowser);
  }

  setSession(token: string, user: AuthUser): void {
    console.log('[AuthState] setSession()', {
      tokenExists: !!token,
      user
    });

    if (this.isBrowser) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }

    this.tokenState.set(token);
    this.userState.set(user);
    this.emitAuthState();
  }

  clear(): void {
    this.clearSession();
  }

  clearSession(): void {
    console.log('[AuthState] clearSession()');

    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    this.tokenState.set(null);
    this.userState.set(null);
    this.emitAuthState();
  }

  hydrateFromStorage(): void {
    if (!this.isBrowser) {
      console.log('[AuthState] hydrateFromStorage() - not browser');
      this.tokenState.set(null);
      this.userState.set(null);
      this.emitAuthState();
      return;
    }

    const token = localStorage.getItem('token');
    const user = this.readUserFromStorage();

    console.log('[AuthState] hydrateFromStorage()', {
      tokenFromStorage: token,
      hasToken: !!token,
      userFromStorage: user
    });

    this.tokenState.set(token);
    this.userState.set(user);
    this.emitAuthState();
  }

  hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  debugState(label = 'debugState'): void {
    console.log(`[AuthState] ${label}`, {
      isBrowser: this.isBrowser,
      tokenSignal: this.tokenState(),
      userSignal: this.userState(),
      isAuthenticatedSignal: this.isAuthenticated(),
      localStorageToken: this.isBrowser ? localStorage.getItem('token') : null,
      localStorageUser: this.isBrowser ? localStorage.getItem('user') : null
    });
  }

  private emitAuthState(): void {
    const authenticated = !!this.tokenState();

    console.log('[AuthState] emitAuthState()', {
      authenticated,
      token: this.tokenState(),
      user: this.userState()
    });

    this.isAuthenticatedSubject.next(authenticated);
  }

  private readUserFromStorage(): AuthUser | null {
    if (!this.isBrowser) {
      return null;
    }

    const rawUser = localStorage.getItem('user');

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as AuthUser;
    } catch (error) {
      console.error('[AuthState] error parsing user from storage', error);
      return null;
    }
  }
}