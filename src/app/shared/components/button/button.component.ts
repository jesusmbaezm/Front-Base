import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type ButtonVariant =
  | 'primary'
  | 'danger'
  | 'danger-outline'
  | 'danger-soft'
  | 'success'
  | 'success-outline'
  | 'success-soft'
  | 'warning'
  | 'secondary'
  | 'ghost'
  | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <button
      class="btn"
      [ngClass]="[variantClass, sizeClass, iconOnly ? 'btn-icon-only' : '']"
      [disabled]="disabled || loading"
      [type]="type"
      (click)="onClick.emit($event)">

      <span *ngIf="loading" class="btn-spinner" [style.width.px]="iconSize" [style.height.px]="iconSize"></span>

      <span *ngIf="dotColor && !loading"
        class="btn-dot"
        [style.background]="dotColor">
      </span>

      <mat-icon *ngIf="matIcon && !loading"
        [style.font-size.px]="iconSize"
        [style.width.px]="iconSize"
        [style.height.px]="iconSize"
        [style.line-height.px]="iconSize">{{ matIcon }}</mat-icon>

      <span *ngIf="symbolIcon && !loading"
        class="material-symbols-outlined"
        [style.font-size.px]="iconSize"
        [style.width.px]="iconSize"
        [style.height.px]="iconSize"
        [style.line-height.px]="iconSize">{{ symbolIcon }}</span>

      <svg *ngIf="leadingIcon"
        [attr.width]="iconSize" [attr.height]="iconSize"
        viewBox="0 0 24 24" fill="none"
        [attr.stroke-width]="iconStroke"
        stroke="currentColor"
        stroke-linecap="round" stroke-linejoin="round">
        <path [attr.d]="leadingIcon" />
      </svg>

      <ng-content *ngIf="!iconOnly" />

      <svg *ngIf="trailingIcon"
        [attr.width]="iconSize" [attr.height]="iconSize"
        viewBox="0 0 24 24" fill="none"
        [attr.stroke-width]="iconStroke"
        stroke="currentColor"
        stroke-linecap="round" stroke-linejoin="round">
        <path [attr.d]="trailingIcon" />
      </svg>

    </button>
  `,
  styles: [`
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border-radius: 6px;
      font-family: 'Inter', system-ui, sans-serif;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: background 0.15s, opacity 0.15s;
      white-space: nowrap;

      &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
        pointer-events: none;
      }
    }

    .btn svg {
      flex-shrink: 0;
      color: inherit;
    }

    .btn mat-icon {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      padding: 0;
      line-height: 1;
      vertical-align: middle;
      transform: translateY(1px);
    }

    /* ── Sizes ───────────────────────────────────── */
    .btn-sm { height: 28px; padding: 0 10px; font-size: 12px; }
    .btn-md { height: 36px; padding: 0 16px; font-size: 13px; }
    .btn-lg { height: 42px; padding: 0 20px; font-size: 14px; }

    /* ── Icon-only: padding cuadrado ─────────────── */
    .btn-icon-only {
      padding: 0;
      gap: 0;
      &.btn-sm { width: 28px; }
      &.btn-md { width: 36px; }
      &.btn-lg { width: 42px; }
    }

    /* ── Variants ────────────────────────────────── */
    .btn-primary {
      background: #2F4499;
      color: #FFFFFF;
      &:hover:not(:disabled) { background: #1C2B5E; }
    }

    .btn-danger {
      background: #C0392B;
      color: #FFFFFF;
      &:hover:not(:disabled) { background: #96281B; }
    }

    .btn-danger-outline {
      background: #FFFFFF;
      color: #C0392B;
      border: 1.2px solid #C0392B;
      &:hover:not(:disabled) { background: #FEF2F2; }
    }

    .btn-danger-soft {
      background: #FEF2F2;
      color: #C0392B;
      border: 1.2px solid #C0392B;
      &:hover:not(:disabled) { background: #FEE2E2; }
    }

    .btn-success {
      background: #059669;
      color: #FFFFFF;
      &:hover:not(:disabled) { background: #047857; }
    }

    .btn-success-outline {
      background: #FFFFFF;
      color: #059669;
      border: 1.2px solid #059669;
      &:hover:not(:disabled) { background: #F0FBF7; }
    }

    .btn-success-soft {
      background: #F0FBF7;
      color: #059669;
      border: 1.2px solid #059669;
      &:hover:not(:disabled) { background: #D1FAE5; }
    }

    .btn-warning {
      background: #F5A623;
      color: #5C3800;
      &:hover:not(:disabled) { background: #D4911F; }
    }

    .btn-secondary {
      background: #F7F9FC;
      color: #2F4499;
      border: 1.2px solid #2F4499;
      &:hover:not(:disabled) { background: #EFF3FF; }
    }

    .btn-ghost {
      background: #FFFFFF;
      color: #374151;
      border: 1px solid #E5E7EB;
      &:hover:not(:disabled) { background: #F9FAFB; }
    }

    .btn-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .btn-spinner {
      border-radius: 50%;
      border: 1.5px solid currentColor;
      border-top-color: transparent;
      animation: btn-spin 0.65s linear infinite;
      flex-shrink: 0;
    }

    @keyframes btn-spin {
      to { transform: rotate(360deg); }
    }

    .btn-link {
      background: transparent;
      color: #2F4499;
      border: none;
      padding: 0;
      height: auto;
      font-weight: 500;
      text-decoration: underline;
      text-underline-offset: 2px;
      &:hover:not(:disabled) { color: #1C2B5E; }
    }
  `],
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() matIcon?: string;
  @Input() symbolIcon?: string;
  @Input() dotColor?: string;
  @Input() leadingIcon?: string;
  @Input() trailingIcon?: string;
  @Input() iconOnly: boolean = false;
  @Output() onClick = new EventEmitter<MouseEvent>();

  get variantClass(): string { return `btn-${this.variant}`; }
  get sizeClass(): string    { return `btn-${this.size}`; }

  get iconSize(): number {
    return this.size === 'sm' ? 14 : this.size === 'lg' ? 18 : 16;
  }

  get iconStroke(): string {
    return this.size === 'lg' ? '1.8' : '1.5';
  }
}
