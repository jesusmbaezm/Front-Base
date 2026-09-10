import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject
} from '@angular/core';
import { AuthStateService } from '../session/auth-state.service';

@Directive({
  selector: '[appHasAnyPermission]',
  standalone: true
})
export class HasAnyPermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authState = inject(AuthStateService);

  private requiredPermissions: string[] = [];
  private hasView = false;

  constructor() {
    effect(() => {
      const allowed = this.authState.hasAnyPermission(this.requiredPermissions);
      this.updateView(allowed);
    });
  }

  @Input()
  set appHasAnyPermission(permissions: string[]) {
    this.requiredPermissions = permissions ?? [];
    this.updateView(this.authState.hasAnyPermission(this.requiredPermissions));
  }

  private updateView(allowed: boolean): void {
    if (allowed && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
      return;
    }

    if (!allowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}