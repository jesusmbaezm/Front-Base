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
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authState = inject(AuthStateService);

  private requiredPermission: string | null = null;
  private hasView = false;

  constructor() {
    effect(() => {
      const permission = this.requiredPermission;
      const allowed = permission ? this.authState.hasPermission(permission) : false;
      this.updateView(allowed);
    });
  }

  @Input()
  set appHasPermission(permission: string) {
    this.requiredPermission = permission;
    this.updateView(this.authState.hasPermission(permission));
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