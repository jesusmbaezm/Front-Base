import { ApplicationConfig, APP_INITIALIZER, LOCALE_ID, DEFAULT_CURRENCY_CODE } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsMx from '@angular/common/locales/es-MX';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';

import { appRoutes } from './app.routes';
import { AppConfigService } from './core/utils/app-config.service';
import { SessionBootstrapService } from './core/session/session-bootstrap.service';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

function initializeApp(
  appConfigService: AppConfigService,
  sessionBootstrapService: SessionBootstrapService
): () => Promise<void> {
  return async () => {
    await appConfigService.load();
    sessionBootstrapService.init();
  };
}

registerLocaleData(localeEsMx);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-MX' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'MXN' },
    provideRouter(appRoutes),
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AppConfigService, SessionBootstrapService],
      multi: true,
    },
  ],
};
