import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { SessionTimePipe } from './session-time.pipe';

const COUNTDOWN_SECONDS = 5 * 60;

@Component({
  selector: 'app-session-expiry-dialog',
  standalone: true,
  imports: [MatDialogModule, SessionTimePipe],
  templateUrl: './session-expiry-dialog.component.html',
  styleUrl: './session-expiry-dialog.component.scss',
})
export class SessionExpiryDialogComponent implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<SessionExpiryDialogComponent>);

  readonly sessionDuration = COUNTDOWN_SECONDS;
  timeLeft = COUNTDOWN_SECONDS;
  private timer: ReturnType<typeof setInterval> | undefined;

  get progressPct(): number {
    return Math.max(0, (this.timeLeft / this.sessionDuration) * 100);
  }

  ngOnInit(): void {
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this.dialogRef.close('logout');
      }
    }, 1000);
  }

  onContinue(): void {
    clearInterval(this.timer);
    this.dialogRef.close('extend');
  }

  onLogout(): void {
    clearInterval(this.timer);
    this.dialogRef.close('logout');
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
}
