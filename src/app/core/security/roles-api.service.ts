import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';

import { AppConfigService } from '../utils/app-config.service';
import { Role, CreateRoleRequest, UpdateRoleRequest } from '../models/role.model';
import { Permission } from '../models/permissions.model';
import { BackendResponse } from '../models/general.model';

@Injectable({
  providedIn: 'root',
})
export class RolesApiService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  getRoles(): Observable<BackendResponse<Role[]>> {
    const { apiUrl } = this.appConfig.settings;
    const url = `${apiUrl}/roles`;

    return this.http.get<BackendResponse<Role[]>>(url).pipe(
      timeout(this.appConfig.settings.requestTimeoutMs)
    );
  }

  /** Lightweight select list — accessible with users.read permission only. */
  getRolesSelect(): Observable<BackendResponse<Role[]>> {
    return this.http.get<BackendResponse<Role[]>>(
      `${this.appConfig.settings.apiUrl}/roles/select`
    ).pipe(timeout(this.appConfig.settings.requestTimeoutMs));
  }

  getRole(id: number): Observable<BackendResponse<Role>> {
    const { apiUrl } = this.appConfig.settings;
    const url = `${apiUrl}/roles/${id}`;

    return this.http.get<BackendResponse<Role>>(url).pipe(
      timeout(this.appConfig.settings.requestTimeoutMs)
    );
  }

  createRole(payload: CreateRoleRequest): Observable<BackendResponse<Role>> {
    const { apiUrl } = this.appConfig.settings;
    const url = `${apiUrl}/roles`;

    return this.http.post<BackendResponse<Role>>(url, payload).pipe(
      timeout(this.appConfig.settings.requestTimeoutMs)
    );
  }

  updateRole(id: number, payload: UpdateRoleRequest): Observable<BackendResponse<Role>> {
    const { apiUrl } = this.appConfig.settings;
    const url = `${apiUrl}/roles/${id}`;

    return this.http.put<BackendResponse<Role>>(url, payload).pipe(
      timeout(this.appConfig.settings.requestTimeoutMs)
    );
  }

  deleteRole(id: number): Observable<BackendResponse<void>> {
    const { apiUrl } = this.appConfig.settings;
    const url = `${apiUrl}/roles/${id}`;

    return this.http.delete<BackendResponse<void>>(url).pipe(
      timeout(this.appConfig.settings.requestTimeoutMs)
    );
  }

  getPermissions(): Observable<BackendResponse<Permission[]>> {
    const { apiUrl } = this.appConfig.settings;
    const url = `${apiUrl}/roles/permissions`;

    return this.http.get<BackendResponse<Permission[]>>(url).pipe(
      timeout(this.appConfig.settings.requestTimeoutMs)
    );
  }
}
