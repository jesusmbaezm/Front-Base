import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { ButtonComponent } from '@app/shared/components/button/button.component';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PagedRequest, ParameterDto } from '@app/core/models/parameters.model';
import { ToastService } from '@app/shared/services/toast.service';
import { ParametersService } from '@app/core/security/parameters.api.service';
import { ParameterFormDialog } from './parameter-form-dialog/parameter-form-dialog';
import { HasPermissionDirective } from '@app/core/directives/has-permission.directive';
import { PERMISSIONS } from '@app/core/security/permissions';


@Component({
  selector: 'app-parametros-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    ButtonComponent,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    HasPermissionDirective,
  ],
  templateUrl: './parametros-page.html',
  styleUrl: './parametros-page.scss',
})
export class ParametrosPage implements OnInit {
  protected readonly Permissions = PERMISSIONS;
  private readonly parameterService = inject(ParametersService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  readonly displayedColumns = ['parameter', 'value', 'actions'];

  readonly parameters = signal<ParameterDto[]>([]);
  readonly isLoading = signal(false);
  readonly searchControl = signal('');

  ngOnInit(): void {
    this.loadParameters();
  }

  loadParameters(): void {
    this.isLoading.set(true);

    const filter: PagedRequest = {
          search: this.searchControl() || null,
          sortBy: null,
          sortDescending: true,
        };

    this.parameterService.getParameter(filter).subscribe({
      next: (response) => {
        this.parameters.set(response.data.items);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[ParametrosPage] loadParameters()', err);
        this.isLoading.set(false);
        this.toast.error('Error al cargar parámetros', 'Error');
      }
    });
  }

  openEditDialog(parameter: ParameterDto): void {
    const dialogRef = this.dialog.open(ParameterFormDialog, {
      panelClass: 'demo-dialog-panel',
      width: '500px',
      disableClose: true,
      data: { parameter, isEdit: true }
    });

    const component: any = dialogRef.componentInstance;
    component.submitForm.subscribe((result: any) => {
      component.setSubmitting(true);
      this.parameterService.updateParameter(parameter.id, result.data).subscribe({
        next: () => {
          component.setSubmitting(false);
          dialogRef.close(true);
          this.toast.success('Parámetro actualizado exitosamente', 'Éxito');
          this.loadParameters();
        },
        error: (err) => {
          component.setSubmitting(false);
          console.error('[ParametrosPage] updateParameter()', err);
          this.toast.error('Error al actualizar parámetro', 'Error');
        }
      });
    });
  }

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  onSearchInput(value: string): void {
    this.searchControl.set(value);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadParameters();
    }, 400);
  }

  clearFilters(): void {
    this.searchControl.set('');
    this.loadParameters();
  }
}

