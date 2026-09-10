import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { SessionService } from '../session/session.service';
import { APP_PATHS } from '../navigation/app-paths';

export const publicOnlyGuard: CanActivateFn = (): boolean | UrlTree => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  return sessionService.isAuthenticated()
    ? router.createUrlTree([APP_PATHS.dashboard])
    : true;
};