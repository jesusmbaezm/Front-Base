import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface PromptDialogData {
  title: string;
  message: string;
  placeholder?: string;
  confirmText?: string;
}

@Component({
  selector: 'app-prompt-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="prompt-dialog">
      <h2 mat-dialog-title>{{ data.title }}</h2>
      
      <mat-dialog-content>
        <p>{{ data.message }}</p>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ data.placeholder }}</mat-label>
          <textarea 
            matInput 
            [(ngModel)]="value" 
            rows="3"
            [placeholder]="data.placeholder || ''"
          ></textarea>
        </mat-form-field>
      </mat-dialog-content>
      
      <mat-dialog-actions align="center">
        <button mat-button (click)="onCancel()">
          Cancelar
        </button>
        <button 
          mat-flat-button 
          color="warn" 
          (click)="onConfirm()"
          [disabled]="!value.trim()">
          {{ data.confirmText || 'Aceptar' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .prompt-dialog {
      padding: 8px;
      min-width: 320px;
    }

    .prompt-dialog h2 {
      margin: 0 0 8px;
      font-size: 20px;
      font-weight: 600;
    }

    .prompt-dialog p {
      margin: 0 0 16px;
      color: #64748b;
      font-size: 14px;
    }

    .prompt-dialog mat-dialog-content {
      padding-top: 8px;
    }

    .full-width {
      width: 100%;
    }

    .prompt-dialog mat-dialog-actions {
      margin-top: 16px;
      gap: 12px;
      justify-content: center;
    }
  `]
})
export class PromptDialog {
  readonly dialogRef = inject(MatDialogRef<PromptDialog>);
  readonly data = inject<PromptDialogData>(MAT_DIALOG_DATA);

  value = '';

  onConfirm(): void {
    if (this.value.trim()) {
      this.dialogRef.close(this.value.trim());
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
