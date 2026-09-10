import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-unauthorized-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule],
  template: `
    <div class="unauthorized-page">
      <h1>Acceso denegado</h1>
      <p>No tienes permisos para acceder a esta sección.</p>

      <a mat-raised-button color="primary" routerLink="/dashboard">
        Ir al dashboard
      </a>
    </div>
  `,
  styles: [`
    .unauthorized-page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      text-align: center;
      padding: 24px;
    }

    .unauthorized-page h1 {
      margin-bottom: 8px;
      font-size: 28px;
      font-weight: 700;
    }

    .unauthorized-page p {
      margin-bottom: 20px;
      color: #6b7280;
    }
  `]
})
export class UnauthorizedPage {}