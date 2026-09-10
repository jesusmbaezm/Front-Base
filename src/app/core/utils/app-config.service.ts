import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface AppConfig {
  appName: string;
  apiUrl: string;
  loginEndpoint: string;
  tokenHeader: string;
  requestTimeoutMs: number;
  session: {
    inactivityMinutes: number;
  };
}

const DEFAULT_APP_CONFIG: AppConfig = {
  appName: 'JAEL',
  apiUrl: '',
  loginEndpoint: '/auth/login',
  tokenHeader: 'Authorization',
  requestTimeoutMs: 15000,
  session: {
    inactivityMinutes: 15
  },
};

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly httpBackend = inject(HttpBackend);
  private readonly http = new HttpClient(this.httpBackend);

  private config: AppConfig = DEFAULT_APP_CONFIG;
  private loaded = false;

  async load(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      this.config = DEFAULT_APP_CONFIG;
      this.loaded = true;
      return;
    }

    const loadedConfig = await firstValueFrom(
      this.http.get<AppConfig>('/config/app-config.json')
    );

    this.config = {
      ...DEFAULT_APP_CONFIG,
      ...loadedConfig,
    };
    this.loaded = true;
  }

  get settings(): AppConfig {
    return this.config;
  }

  get hasLoaded(): boolean {
    return this.loaded;
  }

    get inactivityMinutes(): number {
    return this.settings.session?.inactivityMinutes ?? 1;
  }
}