import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  @Input() title = 'SIG JAEL';
  @Input() userName = '';
  @Input() roleName = '';

  @Output() menuClick = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  get userInitials(): string {
    return (this.userName || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  }

  getAvatarStyle(role: string): object {
    const map: Record<string, object> = {
      Admin:       { background: '#3730a3', color: 'white' },
      Almacenista: { background: '#eef9f4', color: '#1a7a4a' },
      Autorizador: { background: '#fff4e5', color: '#c2590a' },
      Cajero:      { background: '#fdf3f3', color: '#b91c1c' },
      Vendedor:    { background: '#f0f0f8', color: '#3730a3' },
    };
    return map[role] ?? { background: '#f0f0f8', color: '#3730a3' };
  }
}
