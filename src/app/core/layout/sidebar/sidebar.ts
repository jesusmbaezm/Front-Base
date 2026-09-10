import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { NAVIGATION_MODULES } from './navigation.config';
import { NavModule, NavView } from './navigation.models';
import { AuthStateService } from '../../session/auth-state.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar implements OnInit {
  @Input() appName = 'JAEL';

  private readonly router = inject(Router);
  private readonly authState = inject(AuthStateService);

  readonly modules = NAVIGATION_MODULES;
  openGroups: Record<string, boolean> = {};

  ngOnInit(): void {
    for (const module of this.visibleModules) {
      const isGroup = module.children.length > 1 || module.forceGroup;
      if (isGroup && this.isGroupActive(module)) {
        this.openGroups[module.label] = true;
      }
    }
  }

  toggleGroup(label: string): void {
    this.openGroups[label] = !this.openGroups[label];
  }

  private hasModulePermission(permission: string | string[]): boolean {
    if (Array.isArray(permission)) {
      return this.authState.hasAnyPermission(permission);
    }
    return this.authState.hasPermission(permission);
  }

  get visibleModules(): NavModule[] {
    return this.modules
      .filter(module => this.hasModulePermission(module.permission))
      .map(module => {
        const wasGroup = module.children.length > 1;
        return {
          ...module,
          children: module.children.filter(view =>
            this.hasModulePermission(view.permission)
          ),
          forceGroup: module.forceGroup || wasGroup,
        };
      })
      .filter(module => module.children.length > 0);
  }

  private readonly fromContextRoutes: Record<string, string> = {
    authorizations: '/authorizations/pending-quotations',
    'authorizations-returns': '/authorizations/pending-returns',
    'authorizations-reconcile-periods': '/authorizations/reconcile-periods',
  };

  private getEffectiveUrl(): string {
    const [path, queryString] = this.router.url.split('?');
    const params = new URLSearchParams(queryString || '');
    const from = params.get('from');
    if (from && this.fromContextRoutes[from]) {
      return this.fromContextRoutes[from];
    }
    return path;
  }

  isGroupActive(module: NavModule): boolean {
    const url = this.getEffectiveUrl();
    return module.children.some(c => url === c.route || url.startsWith(c.route + '/'));
  }

  isChildActive(module: NavModule, child: NavView): boolean {
    const url = this.getEffectiveUrl();
    const candidates = module.children.filter(
      c => url === c.route || url.startsWith(c.route + '/')
    );
    if (!candidates.length) return false;
    const best = candidates.reduce((a, b) => (b.route.length > a.route.length ? b : a));
    return best.route === child.route;
  }
}
