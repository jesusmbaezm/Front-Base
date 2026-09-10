import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Branch, BranchOption } from '@app/core/models/branch.models';
import { BranchesApiService } from '@app/core/security/branches-api.service';

export interface BranchFormDialogData {
  excludeBranchIds?: number[];
}

export interface BranchFormDialogResult {
  branchId: number;
  branchName: string;
}

@Component({
  selector: 'app-shipmente-branch-form-dialog',
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
    MatSelectModule,
  ],
  templateUrl: './shipmente-branch-form-dialog.html',
  styleUrl: './shipmente-branch-form-dialog.scss',
})
export class ShipmenteBranchFormDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ShipmenteBranchFormDialog>);
  readonly data = inject<BranchFormDialogData>(MAT_DIALOG_DATA);
  private readonly branchesApi = inject(BranchesApiService);

  readonly isSubmitting = signal(false);
  readonly allBranches = signal<BranchOption[]>([]);
  readonly isLoadingBranch = signal(true);

  form!: FormGroup;

  get availableBranches(): BranchOption[] {
    const excluded = new Set(this.data.excludeBranchIds ?? []);
    return this.allBranches().filter(b => !excluded.has(b.id));
  }

  ngOnInit(): void {
    this.formBuilder();
    this.loadBranches();
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const branchId = Number(this.form.value.branchId);
    const branch = this.allBranches().find(b => b.id === branchId);
    this.dialogRef.close({ branchId, branchName: branch?.name ?? '' } as BranchFormDialogResult);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  loadBranches(): void {
    this.branchesApi.getDestinationBranches().subscribe({
      next: (response) => {
        this.allBranches.set(response.data);
        this.isLoadingBranch.set(false);
      },
      error: () => this.isLoadingBranch.set(false),
    });
  }

  formBuilder(): void {
    this.form = this.fb.group({
      branchId: ['', [Validators.required]],
    });
  }
}
