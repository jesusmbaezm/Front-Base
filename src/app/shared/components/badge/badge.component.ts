import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant =
  | 'success'
  | 'success-soft'
  | 'info'
  | 'info-soft'
  | 'warning'
  | 'warning-soft'
  | 'danger'
  | 'danger-soft'
  | 'purple'
  | 'neutral'
  | 'neutral-soft';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [class]="'badge badge-' + variant + (size === 'xs' ? ' badge-xs' : '')">
      <span class="dot"></span>
      <span class="label">{{ label }}</span>
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* ── Variants ────────────────────────────────────────────
       Conciliado, Disponible, Aceptado, Completado */
    .badge-success        { background: #D1FAE5; color: #065F46; border: 0.5px solid #6EE7B7; }
    .badge-success        .dot { background: #065F46; }

    /* Activo, Vigente, Autorizado */
    .badge-success-soft   { background: #F0FDF4; color: #166534; border: 0.5px solid #BBF7D0; }
    .badge-success-soft   .dot { background: #16A34A; }

    /* Abierto, En tránsito, En proceso */
    .badge-info           { background: #DBEAFE; color: #1E40AF; border: 0.5px solid #93C5FD; }
    .badge-info           .dot { background: #1E40AF; }

    /* Enviado, Pendiente revisión */
    .badge-info-soft      { background: #EFF6FF; color: #1D4ED8; border: 0.5px solid #BFDBFE; }
    .badge-info-soft      .dot { background: #3B82F6; }

    /* Por conciliar, Bajo stock, Por vencer */
    .badge-warning        { background: #FFEDD5; color: #9A3412; border: 0.5px solid #FED7AA; }
    .badge-warning        .dot { background: #F97316; }

    /* Con incidencia, Requiere atención */
    .badge-warning-soft   { background: #FEF3C7; color: #92400E; border: 0.5px solid #FDE68A; }
    .badge-warning-soft   .dot { background: #D97706; }

    /* Cancelado, Rechazado, Error */
    .badge-danger         { background: #FEE2E2; color: #991B1B; border: 0.5px solid #FCA5A5; }
    .badge-danger         .dot { background: #DC2626; }

    /* No conciliado, Con diferencia */
    .badge-danger-soft    { background: #FEF2F2; color: #B91C1C; border: 0.5px solid #FECACA; }
    .badge-danger-soft    .dot { background: #EF4444; }

    /* Pend. autorizar, En aprobación, Exceso stock */
    .badge-purple         { background: #E0E7FF; color: #3730A3; border: 0.5px solid #C7D2FE; }
    .badge-purple         .dot { background: #4338CA; }

    /* Cerrado, Inactivo, Archivado */
    .badge-neutral        { background: #F1F5F9; color: #475569; border: 0.5px solid #CBD5E1; }
    .badge-neutral        .dot { background: #475569; }

    /* Borrador, Sin actividad */
    .badge-neutral-soft   { background: #F8FAFC; color: #64748B; border: 0.5px solid #E2E8F0; }
    .badge-neutral-soft   .dot { background: #94A3B8; }

    /* ── Size xs ──── */
    .badge-xs {
      padding: 1px 6px;
      font-size: 10px;
      gap: 3px;
    }
    .badge-xs .dot {
      width: 5px;
      height: 5px;
    }
  `],
})
export class BadgeComponent {
  @Input({ required: true }) variant!: string;
  @Input({ required: true }) label!: string;
  @Input() size: 'sm' | 'xs' = 'sm';
}
