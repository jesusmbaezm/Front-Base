import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { AppConfigService } from '../utils/app-config.service';
import {
  DashboardRecentActivityResponse,
  DashboardOverviewResponse,
} from '../models/dashboard.models';

@Injectable({
  providedIn: 'root',
})
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  
}
