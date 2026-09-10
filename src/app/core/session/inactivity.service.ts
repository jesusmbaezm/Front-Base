import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { fromEvent, merge, Subscription } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

const THROTTLE_MS = 30_000; // un evento cada 30s máximo

@Injectable({
  providedIn: 'root',
})
export class InactivityService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private activitySubscription?: Subscription;
  private enabled = false;
  private lastActivity = Date.now();

  /** Devuelve true si hubo actividad en los últimos `windowMs` ms */
  isRecentlyActive(windowMs = 5 * 60 * 1000): boolean {
    return Date.now() - this.lastActivity < windowMs;
  }

  start(): void {
    if (!isPlatformBrowser(this.platformId) || this.enabled) return;

    this.enabled = true;
    this.lastActivity = Date.now();

    const activity$ = merge(
      fromEvent(this.document, 'mousedown'),
      fromEvent(this.document, 'keydown'),
      fromEvent(this.document, 'scroll', { passive: true }),
      fromEvent(this.document, 'touchstart', { passive: true }),
    );

    this.activitySubscription = activity$
      .pipe(throttleTime(THROTTLE_MS))
      .subscribe(() => {
        this.lastActivity = Date.now();
      });
  }

  stop(): void {
    this.enabled = false;
    this.activitySubscription?.unsubscribe();
    this.activitySubscription = undefined;
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
