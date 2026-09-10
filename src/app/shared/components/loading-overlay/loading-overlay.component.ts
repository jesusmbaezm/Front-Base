import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    @if (visible()) {
      <div class="loading-overlay">
        <mat-spinner [diameter]="diameter()"></mat-spinner>
        @if (message()) {
          <p class="loading-message">{{ message() }}</p>
        }
      </div>
    }
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      gap: 16px;
    }

    .loading-message {
      color: white;
      font-size: 16px;
      font-weight: 500;
    }
  `]
})
export class LoadingOverlayComponent {
  visible = input<boolean>(false);
  message = input<string>('');
  diameter = input<number>(50);
}