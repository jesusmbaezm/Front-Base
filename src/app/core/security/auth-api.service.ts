import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout, map, Observable } from 'rxjs';

import { AppConfigService } from '../utils/app-config.service';
import {
  LoginApiResponse,
  LoginRequest,
  LoginResponse,
  BackendResponse,
  RefreshTokenResponse,
} from '../models/auth.models';
import { ForgotPasswordRequest, ResetPasswordRequest } from '../models/user.models';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);
  private readonly tokenStorage = inject(TokenStorageService);

  login(payload: LoginRequest): Observable<LoginResponse> {
    const { apiUrl, loginEndpoint, requestTimeoutMs } = this.appConfig.settings;
    const url = `${apiUrl}${loginEndpoint}`;

    return this.http.post<BackendResponse<LoginApiResponse>>(url, payload).pipe(
      timeout(requestTimeoutMs),
      map((response) => ({
        accessToken: response.data.token,
        expiresAt: new Date(response.data.expiresAt).getTime(),
        user: {
          id: '',
          email: response.data.email,
          fullName: response.data.name,
          roles: response.data.roles ?? [],
          permissions: response.data.permissions ?? [],
          branches: response.data.branches ?? [],
        },
      })),
    );
  }

  refreshToken(): Observable<LoginResponse> {
    const { apiUrl, requestTimeoutMs } = this.appConfig.settings;
    const url = `${apiUrl}/auth/refresh`;

    // El interceptor de auth ya agrega el header Authorization automáticamente
    return this.http.post<BackendResponse<RefreshTokenResponse>>(url, {}).pipe(
      timeout(requestTimeoutMs),
      map((response) => ({
        accessToken: response.data.token,
        expiresAt: new Date(response.data.expiresAt).getTime(),
        user: this.tokenStorage.getSession()?.user ?? {
          id: '',
          email: '',
          fullName: '',
          roles: [],
          permissions: [],
          branches: [],
        },
      })),
    );
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<BackendResponse<void>> {
    const { apiUrl, requestTimeoutMs } = this.appConfig.settings;
    const url = `${apiUrl}/auth/forgot-password`;

    return this.http.post<BackendResponse<void>>(url, payload).pipe(timeout(requestTimeoutMs));
  }

  ResetPassword(payload: ResetPasswordRequest): Observable<BackendResponse<void>> {
    const { apiUrl, requestTimeoutMs } = this.appConfig.settings;
    const url = `${apiUrl}/auth/reset-password`;

    return this.http.post<BackendResponse<void>>(url, payload).pipe(timeout(requestTimeoutMs));
  }
}
