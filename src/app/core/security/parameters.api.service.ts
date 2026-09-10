import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';

import { AppConfigService } from "../utils/app-config.service";
import { PagedRequest, ParameterDto, ParameterResponse, UpdateParameterDto } from "../models/parameters.model";
import { BackendResponse } from "../models/auth.models";
import { BackendPaginatedResponse } from "../models/general.model";

@Injectable({ providedIn: 'root' })
export class ParametersService{
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  getParameter(filter?: PagedRequest): Observable<BackendPaginatedResponse<ParameterDto>> {
    const { apiUrl } = this.appConfig.settings;
    const url = `${apiUrl}/parameters/paged`;

    let params = new HttpParams();
    if (filter) {
      if (filter.search) params = params.set('search', filter.search);
      if (filter.sortDescending) params = params.set('sortDescending', filter.sortDescending);
      if (filter.search) params = params.set('search', filter.search || "");
      if (filter.page) params = params.set('page', filter.page.toString());
      if (filter.pageSize) params = params.set('pageSize', filter.pageSize.toString());
    }

    return this.http.get<BackendPaginatedResponse<ParameterDto>>(url, { params }).pipe(
      timeout(this.appConfig.settings.requestTimeoutMs)
    );
  }

  updateParameter(id: number, payload: UpdateParameterDto): Observable<ParameterDto> {
    const { apiUrl } = this.appConfig.settings;
    const url = `${apiUrl}/parameters/${id}`;

    return this.http.put<ParameterDto>(url, payload).pipe(
      timeout(this.appConfig.settings.requestTimeoutMs)
    );
  }
}