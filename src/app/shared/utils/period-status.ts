const PERIOD_STATUS_MAP: Record<string, { variant: string; label: string }> = {
  Open:                  { variant: 'info',        label: 'Abierto' },
  Closed:                { variant: 'neutral',      label: 'Cerrado' },
  PendingReconciliation: { variant: 'warning',      label: 'Por conciliar' },
  Reconciled:            { variant: 'success',      label: 'Conciliado' },
  NotReconciled:         { variant: 'danger-soft',  label: 'No conciliado' },
};

export function periodStatusVariant(status: string): string {
  return PERIOD_STATUS_MAP[status]?.variant ?? 'neutral';
}

export function periodStatusLabel(status: string): string {
  return PERIOD_STATUS_MAP[status]?.label ?? status;
}
