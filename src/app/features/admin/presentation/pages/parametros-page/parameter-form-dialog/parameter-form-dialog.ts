import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ParameterDto, UpdateParameterDto } from '@app/core/models/parameters.model';
import { MatInputModule } from "@angular/material/input";
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ModalFooterComponent } from '@app/shared/components/modal-footer/modal-footer.component';

export interface ParameterFormDialogData {
  parameter?: ParameterDto;
  isEdit: boolean;
}

@Component({
  selector: 'app-parameter-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ModalFooterComponent,
  ],
  templateUrl: './parameter-form-dialog.html',
  styleUrl: './parameter-form-dialog.scss',
})
export class ParameterFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ParameterFormDialog>);
  readonly data = inject<ParameterFormDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = this.data.isEdit;
  readonly isSubmitting = signal(false);
  @Output() submitForm = new EventEmitter<{ data: UpdateParameterDto }>();

  readonly form: FormGroup = this.fb.group({
    name: [{ value: this.data.parameter?.name ?? '', disabled: true }],
    value: [this.data.parameter?.value ?? '', [Validators.required]]
  });

  onSave(): void {
    if (this.form.invalid) return;

    const formValue = this.form.getRawValue();
    const updatePayload: UpdateParameterDto = {
      name: formValue.name,
      value: formValue.value,
    };
    this.submitForm.emit({ data: updatePayload });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }
}
