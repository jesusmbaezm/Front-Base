import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UserProfile } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private readonly isBrowser: boolean;
  private readonly STORAGE_KEY = 'session';

  constructor(
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * Guarda la sesión del usuario en localStorage
   */
  saveSession(session: {
    accessToken: string;
    expiresAt: number;
    user: UserProfile;
  }): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
  }

  /**
   * Recupera la sesión del usuario desde localStorage
   */
  getSession(): {
    accessToken: string;
    expiresAt: number;
    user: UserProfile;
  } | null {
    if (!this.isBrowser) {
      return null;
    }

    const raw = localStorage.getItem(this.STORAGE_KEY);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error('[TokenStorageService] error parsing session', error);
      return null;
    }
  }

  /**
   * Obtiene el token de acceso desde la sesión almacenada
   */
  getToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }
    
    const session = this.getSession();
    return session?.accessToken ?? null;
  }

  /**
   * Limpia la sesión del usuario
   */
  clear(): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.removeItem(this.STORAGE_KEY);
  }
}