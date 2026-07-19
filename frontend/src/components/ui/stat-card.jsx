import React from 'react';
import { useCountUp } from '@/hooks/useCountUp';

/**
 * KPI tile — deliberately monochrome. Identity/hierarchy come from typography
 * and spacing, not color. Icon is muted; the number is the hero. Color is
 * reserved for data marks and status elsewhere in the app, never decoration here.
 */
export function StatCard({
  label,
  value,
  suffix = '',
  decimals = 0,
  icon: Icon,
  hint,
  delay = 0,
  index = 0,
}) {
  const animated = useCountUp(Number(value) || 0, { decimals });

  return (
    <div
      className="pp-card pp-card-hover pp-animate-in p-5"
      style={{ animationDelay: `${delay}ms` }}
      data-testid={`kpi-${index}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <Icon size={17} strokeWidth={2} className="text-muted-foreground/70" />
        )}
      </div>

      <p className="mt-3 text-[32px] font-semibold leading-none tracking-tight text-foreground tabular-nums">
        {animated.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
        {suffix && <span className="ml-0.5 text-xl font-medium text-muted-foreground">{suffix}</span>}
      </p>

      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
