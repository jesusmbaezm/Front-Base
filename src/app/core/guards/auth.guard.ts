import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { SessionService } from '../session/session.service';
import { APP_PATHS } from '../navigation/app-paths';

export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const sessionService = inject(SessionService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // En SSR no forzamos redirect por falta de localStorage
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  return sessionService.isAuthenticated()
    ? true
    : router.createUrlTree([APP_PATHS.login]);
};