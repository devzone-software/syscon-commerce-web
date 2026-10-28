/** Reconciliation issues reported by the platform for a sold order. */
export const issueLabels: Record<string, string> = {
  PAYMENT_MISMATCH: 'El pago aprobado no coincide con el total',
  NOT_INVOICED: 'Sin boleta o factura aceptada',
  INVOICED_MISMATCH: 'Lo facturado neto (con notas) no coincide con el total',
};

/** Date in Lima (YYYY-MM-DD), the zone the platform uses for report periods. */
export function limaDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** The last `days` days including today; 30 by default, same as the platform. */
export function defaultPeriod(now = new Date(), days = 30) {
  const to = limaDate(now);
  const from = new Date(`${to}T12:00:00Z`);
  from.setUTCDate(from.getUTCDate() - (days - 1));
  return { from: from.toISOString().slice(0, 10), to };
}

/** Every date of a period (YYYY-MM-DD), so days without sales still show up. */
export function periodDays({ from, to }: { from: string; to: string }): string[] {
  const days: string[] = [];
  for (let day = new Date(`${from}T12:00:00Z`); day.toISOString().slice(0, 10) <= to;) {
    days.push(day.toISOString().slice(0, 10));
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return days;
}

/** Same limits as ReportController: valid dates, ordered, at most 366 days. */
export function periodError(from: string, to: string): string | null {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(from) || !pattern.test(to)) return 'Elige las fechas de inicio y fin.';
  if (from > to) return 'La fecha de inicio debe ser anterior a la de fin.';
  const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000;
  return days >= 366 ? 'El período no puede superar 366 días.' : null;
}
