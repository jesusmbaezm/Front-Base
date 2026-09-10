import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AppConfigService } from '../utils/app-config.service';
import { SessionService } from '../session/session.service';

/**
 * Interceptor de autenticación que agrega el Bearer token a todas las peticiones HTTP.
 * 
 * Este interceptor:
 * 1. Evita agregar el token a peticiones de configuración
 * 2. Agrega el Bearer token a todas las demás peticiones
 * 3. Maneja errores de autenticación (401 Unauthorized)
 * 
 * @param req - La solicitud HTTP saliente
 * @param next - El siguiente manejador en la cadena de interceptores
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const appConfig = inject(AppConfigService);
  const sessionService = inject(SessionService);
  const router = inject(Router);

  const publicUrls = [
    '/config/app-config.json',
    '/auth/login',
  ];

  const isPublicUrl = publicUrls.some(url => req.url.includes(url));
  if (isPublicUrl) {
    return next(req);
  }

  // Lee del signal en memoria — independiente por tab, no se ve afectado
  // cuando otro tab limpia el localStorage.
  const token = sessionService.accessToken();

  if (!token) {
    return next(req);
  }

  const tokenHeader = appConfig.settings.tokenHeader || 'Authorization';

  const authReq = req.clone({
    setHeaders: { [tokenHeader]: `Bearer ${token}` },
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        sessionService.clearSession();
        router.navigate(['/login'], { queryParams: { reason: 'session-expired' } });
      }
      return throwError(() => error);
    })
  );
};
