import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router, UrlTree } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthStateService } from '../session/auth-state.service';

function checkRoutePermission(permission?: string | string[]): boolean | UrlTree {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (!authState.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  if (!permission) {
    return true;
  }

  const hasAccess = Array.isArray(permission)
    ? authState.hasAnyPermission(permission)
    : authState.hasPermission(permission);

  if (hasAccess) {
    return true;
  }

  return router.createUrlTree(['/unauthorized']);
}

export const permissionGuard: CanActivateFn = (route) => {
  const permission = route.data?.['permission'] as string | string[] | undefined;
  return checkRoutePermission(permission);
};

export const permissionChildGuard: CanActivateChildFn = (childRoute) => {
  const permission = childRoute.data?.['permission'] as string | string[] | undefined;
  return checkRoutePermission(permission);
};