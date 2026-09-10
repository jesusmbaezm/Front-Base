import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-modal-footer',
  standalone: true,
  imports: [ButtonComponent, MatProgressSpinnerModule],
  template: `
    <div class="modal-footer">
      <app-button variant="ghost" (onClick)="cancel.emit()">{{ cancelLabel }}</app-button>
      <ng-content></ng-content>
      @if (isSubmitting) {
        <mat-spinner diameter="24"></mat-spinner>
      } @else {
        <app-button variant="primary" [disabled]="saveDisabled" [matIcon]="saveIcon" (onClick)="save.emit()">
          {{ saveLabel }}
        </app-button>
      }
    </div>
  `,
})
export class ModalFooterComponent {
  @Input() cancelLabel = 'Cancelar';
  @Input() saveLabel = 'Guardar';
  @Input() saveDisabled = false;
  @Input() isSubmitting = false;
  @Input() saveIcon?: string;
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
}
