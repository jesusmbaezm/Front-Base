import { CommonModule } from '@angular/common';
import { Component, inject, computed } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';
import { AuthStateService } from '../../session/auth-state.service';
import { AlertService } from '../../../shared/components/alert-dialog/alert.service';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';


@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    Sidebar,
    Topbar
  ],
  templateUrl: './shell-layout.component.html',
  styleUrl: './shell-layout.component.scss'
})
export class ShellLayoutComponent {
  private readonly router = inject(Router);
  private readonly authState = inject(AuthStateService);
  private readonly dialog = inject(MatDialog);
  private readonly alertService = inject(AlertService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  sidebarOpened = true;
  isDarkTheme = false;
  private isContentWidthFixed = false;
  private isCollapsedWidthFixed = true;
  isOver: any;

  userName = computed(() => this.authState.user()?.name ?? '');
  roleName = computed(() => {
    const roles = this.authState.user()?.roles ?? [];
    return roles.length > 0 ? roles.join(', ') : 'Usuario';
  });

  toggleSidebar(): void {
    this.sidebarOpened = !this.sidebarOpened;
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    const html = document.documentElement;

    if (html.classList.contains('theme-dark')) {
      html.classList.remove('theme-dark');
      html.classList.add('theme-light');
    } else {
      html.classList.remove('theme-light');
      html.classList.add('theme-dark');
    }
  }

  onLogout(): void {
    this.confirmDialog
      .confirm({
        variant: 'warning',
        title: 'Cerrar sesión',
        message: '¿Está seguro de que desea cerrar sesión?',
        confirmText: 'Cerrar sesión',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.authState.clearSession();
          this.router.navigate(['/auth/login']);
        }
      });
  }

  onSidenavClosedStart() {
    this.isContentWidthFixed = false;
  }

  onSidenavOpenedChange(isOpened: boolean) {
    this.isCollapsedWidthFixed = !this.isOver;
  }
  
}
