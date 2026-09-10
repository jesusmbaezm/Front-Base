import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ParametrosPageRoutingModule } from './parametros-page-routing-module';
import { ParametrosPage } from './parametros-page';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ParameterFormDialog } from './parameter-form-dialog/parameter-form-dialog';


@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    ParametrosPageRoutingModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ]
})
export class ParametrosPageModule { }
