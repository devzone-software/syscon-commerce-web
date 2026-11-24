import type { ReactNode } from 'react';

export type StatTone = 'blue' | 'green' | 'amber' | 'violet' | 'red' | 'cyan';

/** Headline figure; the optional icon sits in a tinted badge whose color tells the area apart. */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'blue',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: StatTone;
}) {
  return (
    <div className={`bo-stat tone-${tone}${icon ? ' has-icon' : ''}`}>
      {icon && (
        <span className="bo-stat-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="bo-stat-label">{label}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </div>
  );
}
