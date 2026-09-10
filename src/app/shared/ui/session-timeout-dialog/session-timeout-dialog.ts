import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface SessionTimeoutDialogData {
  remainingSeconds: number;
}

@Component({
  selector: 'app-session-timeout-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './session-timeout-dialog.html',
  styleUrl: './session-timeout-dialog.scss'
})
export class SessionTimeoutDialog {
  constructor(
    private readonly dialogRef: MatDialogRef<SessionTimeoutDialog>,
    @Inject(MAT_DIALOG_DATA) public data: SessionTimeoutDialogData
  ) {}

  stayLoggedIn(): void {
    this.dialogRef.close('stay');
  }

  logoutNow(): void {
    this.dialogRef.close('logout');
  }
}