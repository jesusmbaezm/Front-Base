import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AppConfigService } from '../utils/app-config.service';
import { TokenStorageService } from '../security/token-storage.service';
import { SessionService } from '../session/session.service';
import { AlertService } from '@app/shared/components/alert-dialog/alert.service';

/**
 * Interceptor de errores HTTP
 * Maneja errores globalmente y muestra mensajes apropiados
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const appConfig = inject(AppConfigService);
  const tokenStorage = inject(TokenStorageService);
  const sessionService = inject(SessionService);
  const alertService = inject(AlertService);
  const router = inject(Router);

  // URLs que no requieren manejo de errores especial
  const publicUrls = [
    '/config/app-config.json',
    '/auth/login',
  ];

  const isPublicUrl = publicUrls.some(url => req.url.includes(url));
  if (isPublicUrl) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Error 401 - Unauthorized
      if (error.status === 401) {
        console.log('[ErrorInterceptor] Token expirado o inválido, cerrando sesión');
        sessionService.clearSession();
        router.navigate(['/login'], { queryParams: { reason: 'session-expired' } });
        return throwError(() => error);
      }

      // Otros errores - mostrar mensaje
      let errorMessage = 'Ha ocurrido un error inesperado';

      if (error.error) {
        const backendError = error.error;
        
        // Si hay errors array con múltiples elementos, mostrarlos
        if (backendError.errors && backendError.errors.length > 0) {
          errorMessage = backendError.errors.join('\n');
        } 
        // Si hay message, mostrarlo
        else if (backendError.message) {
          errorMessage = backendError.message;
        }
      }

      // Los errores se manejan en los componentes - no mostrar alerts duplicados desde el interceptor
      console.log(`[ErrorInterceptor] Error ${error.status}: ${errorMessage}`);

      return throwError(() => error);
    })
  );
};
