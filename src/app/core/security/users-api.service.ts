import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';

import { AppConfigService } from '../utils/app-config.service';
import { User, CreateUserRequest, UpdateUserRequest, UserFilter } from '../models/user.models';
import { BackendPaginatedResponse, BackendResponse } from '../models/general.model';

@Injectable({
  providedIn: 'root',
})
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  getUsersPaged(filter?: UserFilter): Observable<BackendPaginatedResponse<User>> {
    const { apiUrl } = this.appConfig.settings;
    const url = `${apiUrl}/users/paged`;

    let params = new HttpParams();
    if (filter) {
      if (filter.search) params = params.set('search', filter.search);
      if (filter.roleId) params = params.set('roleId', filter.roleId);
      if (filter.isActive !== undefined) params = params.set('isActive', filter.isActive.toString());
      if (filter.page) params = params.set('page', filter.page.toString());
      if (filter.pageSize) params = params.set('pageSize', filter.pageSize.toString());
    }

    return this.http
      .get<BackendPaginatedResponse<User>>(url, { params })
      .pipe(timeout(this.appConfig.settings.requestTimeoutMs));
  }

  getUsers(): Observable<BackendResponse<User>> {
    const { apiUrl } = this.appConfig.settings;
    const url = `${apiUrl}/users`;

    return this.http
      .get<BackendResponse<User>>(url)
      .pipe(timeout(this.appConfig.settings.requestTimeoutMs));
  }

  getUser(id: number): Observable<BackendResponse<User>> {
    const { apiUrl } = this.appConfig.settings;
    const url = `${apiUrl}/users/${id}`;

    return this.http
      .get<BackendResponse<User>>(url)
      .pipe(timeout(this.appConfig.settings.requestTimeoutMs));
  }

  createUser(payload: CreateUserRequest): Observable<BackendResponse<User>> {
    const { apiUrl } = this.appConfig.settings;
    const url = `${apiUrl}/users`;

    return this.http
      .post<BackendResponse<User>>(url, payload)
      .pipe(timeout(this.appConfig.settings.requestTimeoutMs));
  }

  updateUser(id: number, payload: UpdateUserRequest): Observable<BackendResponse<User>> {
    const { apiUrl } = this.appConfig.settings;
    const url = `${apiUrl}/users/${id}`;

    return this.http
      .put<BackendResponse<User>>(url, payload)
      .pipe(timeout(this.appConfig.settings.requestTimeoutMs));
  }

  deleteUser(id: number): Observable<void> {
    const { apiUrl } = this.appConfig.settings;
    const url = `${apiUrl}/users/${id}`;

    return this.http.delete<void>(url).pipe(timeout(this.appConfig.settings.requestTimeoutMs));
  }

  resetPassword(id: number, newPassword: string): Observable<BackendResponse<void>> {
    const { apiUrl } = this.appConfig.settings;
    const url = `${apiUrl}/users/${id}/reset-password`;

    return this.http
      .post<BackendResponse<void>>(url, { newPassword })
      .pipe(timeout(this.appConfig.settings.requestTimeoutMs));
  }
}
